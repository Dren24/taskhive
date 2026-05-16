<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectNotification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function index()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Admins see all projects; regular users see projects they are a member of or have tasks in
        if ($user->isAdmin()) {
            $workspaceUserIds = $user->workspaceUserIds();
            $projects = Project::where(function ($q) use ($workspaceUserIds) {
                    $q->whereIn('user_id', $workspaceUserIds)
                        ->orWhereHas('members', fn($q2) => $q2->whereIn('users.id', $workspaceUserIds))
                        ->orWhereHas('tasks', fn($q2) => $q2->whereIn('user_id', $workspaceUserIds));
                })
                ->withCount('tasks')
                ->with(['members' => fn($q) => $q->withMax('tasks', 'updated_at')])
                ->latest()
                ->get();
        } else {
            $projects = Project::where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->orWhereHas('members', fn($q2) => $q2->where('users.id', $user->id))
                      ->orWhereHas('tasks', fn($q2) => $q2->where('user_id', $user->id));
                })
                ->withCount('tasks')
                ->with(['members' => fn($q) => $q->withMax('tasks', 'updated_at')])
                ->latest()
                ->get();
        }

        return Inertia::render('Projects/Index', [
            'projects' => $projects->map(fn($p) => [
                'id'          => $p->id,
                'name'        => $p->name,
                'color'       => $p->color,
                'tasks_count' => $p->tasks_count,
                'members'     => $p->members->map(fn($m) => $this->memberPayload($m)),
            ]),
            'users' => $user->isAdmin()
                ? $user->managedUsers()->orderBy('name')->get()->map(fn($u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'role' => $u->role,
                ])
                : [],
            'isAdmin' => $user->isAdmin(),
        ]);
    }

    public function store(Request $request)
    {
        /** @var \App\Models\User $authUser */
        $authUser = Auth::user();
        abort_if(!$authUser->isAdmin(), 403, 'Only admins can create projects.');

        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'color'    => 'required|string|max:20',
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
        ]);

        $allowedUserIds = $authUser->managedUsers()->pluck('id')->all();
        abort_unless(empty(array_diff($data['user_ids'], $allowedUserIds)), 403, 'Choose users connected to your workspace.');

        // Primary owner = first selected user (for backward compat)
        $primaryUserId = $data['user_ids'][0];
        $primaryUser = User::findOrFail($primaryUserId);

        $project = $primaryUser->projects()->create([
            'name'  => $data['name'],
            'color' => $data['color'],
        ]);

        // Attach all selected users to the pivot
        $project->members()->sync(collect($data['user_ids'])->mapWithKeys(fn($id) => [
            $id => [
                'access_level' => 'editor',
                'permissions' => json_encode($this->permissionsForAccessLevel('editor')),
            ],
        ])->all());

        // Notify all selected members
        $members = User::whereIn('id', $data['user_ids'])->get();
        foreach ($members as $member) {
            ProjectNotification::create([
                'user_id'    => $member->id,
                'project_id' => $project->id,
                'type'       => 'project_added',
            ]);

            Mail::raw(
                "Hi {$member->name},\n\n"
                . "You have been added to a new project in TaskHive.\n\n"
                . "Project: {$project->name}\n"
                . "Created by: {$authUser->name}\n\n"
                . "Please log in to TaskHive to view the project.",
                function ($message) use ($member, $project) {
                    $message->to($member->email)
                        ->subject("New Project: {$project->name}");
                }
            );
        }

        return back()->with('success', 'Project created.');
    }

    public function addMember(Request $request, Project $project)
    {
        /** @var \App\Models\User $authUser */
        $authUser = Auth::user();
        abort_if(!$authUser->isAdmin(), 403, 'Only admins can add folder members.');
        $this->authorizeWorkspaceProject($project, $authUser);

        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'access_level' => 'nullable|in:viewer,editor,manager',
        ]);

        $member = User::findOrFail($data['user_id']);
        abort_if($member->admin_id !== $authUser->id, 403, 'Choose a user connected to your workspace.');

        $accessLevel = $data['access_level'] ?? 'editor';
        $project->members()->syncWithoutDetaching([
            $member->id => [
                'access_level' => $accessLevel,
                'permissions' => json_encode($this->permissionsForAccessLevel($accessLevel)),
            ],
        ]);

        ProjectNotification::create([
            'user_id' => $member->id,
            'project_id' => $project->id,
            'type' => 'project_added',
        ]);

        return back()->with('success', "{$member->name} was added to {$project->name}.");
    }

    public function updateMember(Request $request, Project $project, User $member)
    {
        /** @var \App\Models\User $authUser */
        $authUser = Auth::user();
        abort_if(!$authUser->isAdmin(), 403, 'Only admins can update folder members.');
        $this->authorizeWorkspaceProject($project, $authUser);
        abort_unless($project->members()->where('users.id', $member->id)->exists(), 404);
        abort_if($member->admin_id !== $authUser->id, 403);

        $data = $request->validate([
            'access_level' => 'required|in:viewer,editor,manager',
        ]);

        $project->members()->updateExistingPivot($member->id, [
            'access_level' => $data['access_level'],
            'permissions' => json_encode($this->permissionsForAccessLevel($data['access_level'])),
        ]);

        ProjectNotification::create([
            'user_id' => $member->id,
            'project_id' => $project->id,
            'type' => 'project_updated',
        ]);

        return back()->with('success', "{$member->name}'s folder access was updated.");
    }

    public function removeMember(Project $project, User $member)
    {
        /** @var \App\Models\User $authUser */
        $authUser = Auth::user();
        abort_if(!$authUser->isAdmin(), 403, 'Only admins can remove folder members.');
        $this->authorizeWorkspaceProject($project, $authUser);
        abort_if($member->admin_id !== $authUser->id, 403);

        $project->members()->detach($member->id);

        return back()->with('success', "{$member->name} was removed from {$project->name}.");
    }

    public function show(Project $project)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Allow admins, project owner, members, or users who have at least one task in this project
        if ($user->isAdmin()) {
            $workspaceUserIds = $user->workspaceUserIds();
            abort_unless(
                in_array($project->user_id, $workspaceUserIds->all(), true)
                || $project->members()->whereIn('users.id', $workspaceUserIds)->exists()
                || $project->tasks()->whereIn('user_id', $workspaceUserIds)->exists(),
                403
            );
        } else {
            abort_unless(
                $project->user_id === $user->id
                || $project->members()->where('users.id', $user->id)->exists()
                || $project->tasks()->where('user_id', $user->id)->exists(),
                403
            );
        }

        $tasks = $user->isAdmin()
            ? $project->tasks()->with(['user', 'leader', 'votes'])->latest()->get()
            : $project->tasks()->where('user_id', $user->id)->with(['user', 'leader', 'votes'])->latest()->get();

        // Build groupMembers map: group_id → [{id, name}, ...]
        $groupIds = $tasks->pluck('group_id')->filter()->unique()->values();
        $groupMembersMap = [];
        if ($groupIds->isNotEmpty()) {
            \App\Models\Task::whereIn('group_id', $groupIds)
                ->with('user:id,name')
                ->get()
                ->each(function ($t) use (&$groupMembersMap) {
                    if ($t->user) {
                        $groupMembersMap[$t->group_id][$t->user->id] = ['id' => $t->user->id, 'name' => $t->user->name];
                    }
                });
        }

        $project->load('comments.user');
        $projectOptions = $user->isAdmin()
            ? Project::whereIn('user_id', $user->workspaceUserIds())->orderBy('name')->get(['id', 'name'])
            : $user->allProjects()->orderBy('name')->get(['id', 'name']);

        $assignableUsers = $user->isAdmin()
            ? $project->members()->where('users.admin_id', $user->id)->orderBy('users.name')->get(['users.id', 'users.name'])
            : collect();

        return Inertia::render('Projects/Show', [
            'project'  => ['id' => $project->id, 'name' => $project->name, 'color' => $project->color],
            'tasks'    => $tasks->map(fn($t) => [
                'id'              => $t->id,
                'title'           => $t->title,
                'status'          => $t->status,
                'priority'        => $t->priority,
                'due_date'        => $t->due_date?->format('Y-m-d'),
                'due_time'        => $t->due_time,
                'description'     => $t->description,
                'project_id'      => $t->project_id,
                'is_overdue'      => $t->status !== 'done' && $t->due_date && $t->due_date->lt(now()->startOfDay()),
                'user'            => $t->user ? ['id' => $t->user->id, 'name' => $t->user->name] : null,
                'group_id'        => $t->group_id ?? null,
                'submission_mode' => $t->submission_mode ?? 'manual',
                'leader'          => $t->leader ? ['id' => $t->leader->id, 'name' => $t->leader->name] : null,
                'vote_counts'     => $t->votes ? $t->votes->countBy('candidate_user_id')->all() : [],
                'my_vote'         => $t->votes ? ($t->votes->firstWhere('voter_user_id', $user->id)?->candidate_user_id) : null,
                'groupMembers'    => $t->group_id ? array_values($groupMembersMap[$t->group_id] ?? []) : [],
            ]),
            'projectOptions'  => $projectOptions,
            'assignableUsers' => $assignableUsers->map(fn($u) => ['id' => $u->id, 'name' => $u->name]),
            'comments' => $project->comments->map(fn($c) => [
                'id'         => $c->id,
                'body'       => $c->body,
                'created_at' => $c->created_at->diffForHumans(),
                'user'       => ['id' => $c->user->id, 'name' => $c->user->name, 'is_admin' => $c->user->isAdmin()],
            ]),
            'isAdmin'  => $user->isAdmin(),
            'authId'   => $user->id,
        ]);
    }

    public function update(Request $request, Project $project)
    {
        /** @var \App\Models\User $authUser */
        $authUser = Auth::user();
        abort_if(!$authUser->isAdmin(), 403, 'Only admins can update projects.');
        abort_unless($project->members()->where('users.admin_id', $authUser->id)->exists() || in_array($project->user_id, $authUser->workspaceUserIds()->all(), true), 403);

        $data = $request->validate([
            'name'  => 'required|string|max:255',
            'color' => 'required|string|max:20',
        ]);

        $project->update($data);

        $members = $project->members()->get(['users.id']);
        foreach ($members as $member) {
            ProjectNotification::create([
                'user_id'    => $member->id,
                'project_id' => $project->id,
                'type'       => 'project_updated',
            ]);
        }

        return back()->with('success', 'Project updated.');
    }

    public function destroy(Project $project)
    {
        /** @var \App\Models\User $authUser */
        $authUser = Auth::user();
        abort_if(!$authUser->isAdmin(), 403, 'Only admins can delete projects.');
        abort_unless($project->members()->where('users.admin_id', $authUser->id)->exists() || in_array($project->user_id, $authUser->workspaceUserIds()->all(), true), 403);

        $normalizedName = strtolower(trim($project->name));
        abort_if(in_array($normalizedName, ['backlog', 'logbook'], true), 422, 'Backlog/Logbook projects cannot be deleted.');

        DB::transaction(function () use ($project) {
            $userIds = $project->tasks()
                ->select('user_id')
                ->distinct()
                ->pluck('user_id');

            foreach ($userIds as $userId) {
                $backlog = Project::firstOrCreate(
                    [
                        'user_id' => $userId,
                        'name' => 'Backlog',
                    ],
                    [
                        'color' => '#6b7280',
                    ]
                );

                $project->tasks()
                    ->where('user_id', $userId)
                    ->update(['project_id' => $backlog->id]);
            }

            $project->delete();
        });

        return redirect()->route('projects.index')->with('success', 'Project deleted.');
    }

    private function authorizeWorkspaceProject(Project $project, User $admin): void
    {
        $workspaceUserIds = $admin->workspaceUserIds();

        abort_unless(
            in_array($project->user_id, $workspaceUserIds->all(), true)
            || $project->members()->whereIn('users.id', $workspaceUserIds)->exists()
            || $project->tasks()->whereIn('user_id', $workspaceUserIds)->exists(),
            403
        );
    }

    private function memberPayload(User $member): array
    {
        $lastActive = $member->tasks_max_updated_at
            ? \Carbon\Carbon::parse($member->tasks_max_updated_at)
            : $member->updated_at;

        $accessLevel = $member->pivot?->access_level ?? 'editor';
        $permissions = $member->pivot?->permissions
            ? json_decode($member->pivot->permissions, true)
            : $this->permissionsForAccessLevel($accessLevel);

        return [
            'id' => $member->id,
            'name' => $member->name,
            'email' => $member->email,
            'role' => $member->role,
            'access_level' => $accessLevel,
            'permissions' => $permissions,
            'online' => $lastActive?->gt(now()->subMinutes(10)) ?? false,
            'last_active' => $lastActive ? $lastActive->diffForHumans() : 'No activity',
        ];
    }

    private function permissionsForAccessLevel(string $accessLevel): array
    {
        return match ($accessLevel) {
            'manager' => ['view', 'comment', 'submit', 'upload', 'manage_tasks'],
            'viewer' => ['view', 'comment'],
            default => ['view', 'comment', 'submit', 'upload'],
        };
    }
}
