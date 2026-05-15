<?php

namespace App\Http\Controllers;

use App\Models\Project;
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
            $projects = Project::withCount('tasks')->with('members')->latest()->get();
        } else {
            $projects = Project::where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->orWhereHas('members', fn($q2) => $q2->where('users.id', $user->id))
                      ->orWhereHas('tasks', fn($q2) => $q2->where('user_id', $user->id));
                })
                ->withCount('tasks')
                ->with('members')
                ->latest()
                ->get();
        }

        return Inertia::render('Projects/Index', [
            'projects' => $projects->map(fn($p) => [
                'id'          => $p->id,
                'name'        => $p->name,
                'color'       => $p->color,
                'tasks_count' => $p->tasks_count,
                'members'     => $p->members->map(fn($m) => ['id' => $m->id, 'name' => $m->name]),
            ]),
            'users' => $user->isAdmin()
                ? User::where('role', 'user')->orderBy('name')->get()->map(fn($u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
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

        // Primary owner = first selected user (for backward compat)
        $primaryUserId = $data['user_ids'][0];
        $primaryUser = User::findOrFail($primaryUserId);

        $project = $primaryUser->projects()->create([
            'name'  => $data['name'],
            'color' => $data['color'],
        ]);

        // Attach all selected users to the pivot
        $project->members()->sync($data['user_ids']);

        // Notify all selected members
        $members = User::whereIn('id', $data['user_ids'])->get();
        foreach ($members as $member) {
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

    public function show(Project $project)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Allow admins, project owner, members, or users who have at least one task in this project
        if (!$user->isAdmin()) {
            abort_unless(
                $project->user_id === $user->id
                || $project->members()->where('users.id', $user->id)->exists()
                || $project->tasks()->where('user_id', $user->id)->exists(),
                403
            );
        }

        $tasks = $project->tasks()->latest()->get();
        $project->load('comments.user');
        $projectOptions = $user->isAdmin()
            ? Project::orderBy('name')->get(['id', 'name'])
            : Project::where('user_id', $user->id)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Projects/Show', [
            'project'  => ['id' => $project->id, 'name' => $project->name, 'color' => $project->color],
            'tasks'    => $tasks->map(fn($t) => [
                'id'        => $t->id,
                'title'     => $t->title,
                'status'    => $t->status,
                'priority'  => $t->priority,
                'due_date'    => $t->due_date?->format('Y-m-d'),
                'due_time'    => $t->due_time,
                'description' => $t->description,
                'project_id'  => $t->project_id,
                'is_overdue' => $t->status !== 'done' && $t->due_date && $t->due_date->lt(now()->startOfDay()),
            ]),
            'projectOptions' => $projectOptions,
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

        $data = $request->validate([
            'name'  => 'required|string|max:255',
            'color' => 'required|string|max:20',
        ]);

        $project->update($data);

        return back()->with('success', 'Project updated.');
    }

    public function destroy(Project $project)
    {
        /** @var \App\Models\User $authUser */
        $authUser = Auth::user();
        abort_if(!$authUser->isAdmin(), 403, 'Only admins can delete projects.');

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
}
