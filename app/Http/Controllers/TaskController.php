<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskNotification;
use App\Models\TaskSubmission;
use App\Models\TaskSubmissionFile;
use App\Models\TaskVote;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TaskController extends Controller
{
    private function userProjects(?User $user = null)
    {
        /** @var User $user */
        $user = $user ?? Auth::user();

        if ($user->isAdmin()) {
            $workspaceUserIds = $user->workspaceUserIds();

            return Project::where(function ($q) use ($workspaceUserIds) {
                    $q->whereIn('user_id', $workspaceUserIds)
                        ->orWhereHas('members', fn($q2) => $q2->whereIn('users.id', $workspaceUserIds))
                        ->orWhereHas('tasks', fn($q2) => $q2->whereIn('user_id', $workspaceUserIds));
                })
                ->orderBy('name')
                ->get();
        }

        return Project::query()
            ->where('user_id', $user->id)
            ->orWhereHas('members', fn($q) => $q->where('users.id', $user->id))
            ->orderBy('name')
            ->get();
    }

    private function hasProjectAccess(User $user, int $projectId): bool
    {
        if ($user->isAdmin()) {
            $workspaceUserIds = $user->workspaceUserIds();

            return Project::where('id', $projectId)
                ->where(function ($q) use ($workspaceUserIds) {
                    $q->whereIn('user_id', $workspaceUserIds)
                        ->orWhereHas('members', fn($q2) => $q2->whereIn('users.id', $workspaceUserIds))
                        ->orWhereHas('tasks', fn($q2) => $q2->whereIn('user_id', $workspaceUserIds));
                })
                ->exists();
        }

        return Project::where('id', $projectId)
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                    ->orWhereHas('members', fn($q2) => $q2->where('users.id', $user->id));
            })
            ->exists();
    }

    public function index()
    {
        /** @var User $user */
        $user = Auth::user();
        $tasks = $user->isAdmin()
            ? Task::with(['user', 'comments.user', 'attachments.user', 'submissions.user', 'submissions.files', 'leader', 'votes'])->withCount('comments')->whereIn('user_id', $user->workspaceUserIds())->latest()->get()
            : $user->tasks()->with(['comments.user', 'attachments.user', 'submissions.user', 'submissions.files', 'leader', 'votes'])->withCount('comments')->latest()->get();

        // Build group_id → [members] map so every group task card can show all voters
        $groupIds = $tasks->pluck('group_id')->filter()->unique()->values();
        $groupMembersMap = [];
        if ($groupIds->isNotEmpty()) {
            Task::whereIn('group_id', $groupIds)
                ->with('user:id,name')
                ->get(['id', 'group_id', 'user_id'])
                ->each(function ($t) use (&$groupMembersMap) {
                    if ($t->group_id && $t->user) {
                        $groupMembersMap[$t->group_id][$t->user->id] = ['id' => $t->user->id, 'name' => $t->user->name];
                    }
                });
        }

        $projectOptions = $user->isAdmin()
            ? $this->userProjects($user)->map(fn($p) => ['id' => $p->id, 'name' => $p->name])
            : $this->userProjects()->map(fn($p) => ['id' => $p->id, 'name' => $p->name]);

        return Inertia::render('Tasks/Index', [
            'tasks' => $tasks->map(fn($t) => [
                'id'          => $t->id,
                'title'       => $t->title,
                'description' => $t->description,
                'priority'    => $t->priority,
                'status'      => $t->status,
                'due_date'    => $t->due_date?->format('Y-m-d'),
                'due_time'    => $t->due_time,
                'project_id'  => $t->project_id,
                'user'        => $t->relationLoaded('user') ? ['name' => $t->user?->name] : null,
                'is_overdue'        => $t->status !== 'done' && $t->due_date && $t->due_date->lt(now()->startOfDay()),
                'comments_count'    => $t->comments_count,
                'submissions_count' => $t->submissions_count,
                'max_submissions'   => $t->max_submissions,
                'group_id'          => $t->group_id,
                'submission_mode'   => $t->submission_mode,
                'leader'            => $t->leader ? ['id' => $t->leader->id, 'name' => $t->leader->name] : null,
                'vote_counts'       => $t->votes->countBy('candidate_user_id')->all(),
                'my_vote'           => $t->votes->firstWhere('voter_user_id', $user->id)?->candidate_user_id,
                'groupMembers'      => $t->group_id ? array_values($groupMembersMap[$t->group_id] ?? []) : [],
                'comments'          => $t->comments->map(fn($c) => [
                    'id'         => $c->id,
                    'body'       => $c->body,
                    'created_at' => $c->created_at->diffForHumans(),
                    'user'       => ['id' => $c->user->id, 'name' => $c->user->name, 'is_admin' => $c->user->isAdmin()],
                ]),
                'attachments' => $t->attachments->map(fn($a) => [
                    'id'            => $a->id,
                    'original_name' => $a->original_name,
                    'size'          => $a->size,
                    'mime_type'     => $a->mime_type,
                    'created_at'    => $a->created_at->diffForHumans(),
                    'user'          => ['id' => $a->user->id, 'name' => $a->user->name],
                    'preview_url'   => str_starts_with((string) $a->mime_type, 'image/') || $a->mime_type === 'application/pdf'
                        ? route('tasks.attachments.preview', [$t->id, $a->id])
                        : null,
                    'download_url'  => route('tasks.attachments.download', [$t->id, $a->id]),
                ]),
                'submissions' => $t->submissions->map(fn($s) => [
                    'id'            => $s->id,
                    'comment'       => $s->comment,
                    'original_name' => $s->original_name,
                    'attempt'       => $s->attempt,
                    'created_at'    => $s->created_at->format('M j, Y g:i A'),
                    'user'          => ['name' => $s->user->name],
                    'download_url'  => $s->file_path ? route('tasks.submissions.download', [$t->id, $s->id]) : null,
                    'files'         => $s->files->map(fn($f) => [
                        'id'            => $f->id,
                        'original_name' => $f->original_name,
                        'size'          => $f->size,
                        'mime_type'     => $f->mime_type,
                        'preview_url'   => str_starts_with((string) $f->mime_type, 'image/') || $f->mime_type === 'application/pdf'
                            ? route('tasks.submissions.files.preview', [$t->id, $s->id, $f->id])
                            : null,
                        'download_url'  => route('tasks.submissions.files.download', [$t->id, $s->id, $f->id]),
                    ]),
                ]),
            ]),
            'projectOptions' => $projectOptions,
            'isAdmin' => $user->isAdmin(),
        ]);
    }

    public function create()
    {
        /** @var User $user */
        $user = Auth::user();
        abort_if(!$user->isAdmin(), 403, 'Only admins can create tasks.');
        $projects = $this->userProjects($user);
        $users = $user->isAdmin()
            ? $user->managedUsers()->orderBy('name')->get()
            : collect();

        // Build project→users map so the frontend can filter by selected project
        $projectUsers = [];
        if ($user->isAdmin()) {
            foreach ($projects as $p) {
                $projectUsers[$p->id] = $p->members()
                    ->where('users.admin_id', $user->id)
                    ->orderBy('name')
                    ->get(['users.id', 'users.name'])
                    ->map(fn($u) => ['id' => $u->id, 'name' => $u->name])
                    ->values()
                    ->all();
            }
        }

        return Inertia::render('Tasks/Create', [
            'projects'     => $projects->map(fn($p) => ['id' => $p->id, 'name' => $p->name]),
            'users'        => $users->map(fn($u) => ['id' => $u->id, 'name' => $u->name]),
            'projectUsers' => $projectUsers,
            'isAdmin'      => $user->isAdmin(),
            'authId'       => $user->id,
        ]);
    }

    public function store(Request $request)
    {
        /** @var User $authUser */
        $authUser = Auth::user();
        abort_if(!$authUser->isAdmin(), 403, 'Only admins can create tasks.');

        $rules = [
            'tasks'                    => 'required|array|min:1',
            'tasks.*.title'            => 'required|string|max:255',
            'tasks.*.description'      => 'nullable|string',
            'tasks.*.priority'         => 'required|in:low,medium,high',
            'tasks.*.status'           => 'required|in:todo,in_progress,done',
            'tasks.*.due_date'         => 'required|date',
            'tasks.*.due_time'         => 'nullable|date_format:H:i',
            'tasks.*.project_id'       => 'required|exists:projects,id',
            'tasks.*.assign_to'        => $authUser->isAdmin() ? 'required|exists:users,id' : 'nullable|exists:users,id',
            'tasks.*.max_submissions'  => 'nullable|integer|min:1',
            'files'                    => 'nullable|array',
            'files.*'                  => 'nullable|array',
            'files.*.*'                => 'sometimes|file|max:51200',
        ];

        $request->validate($rules);

        foreach ($request->input('tasks') as $index => $taskData) {
            /** @var User $targetUser */
            $targetUser = ($authUser->isAdmin() && !empty($taskData['assign_to']))
                ? User::findOrFail($taskData['assign_to'])
                : $authUser;
            abort_if($authUser->isAdmin() && $targetUser->admin_id !== $authUser->id, 403, 'Choose a user connected to your workspace.');

            $projectId = (int) $taskData['project_id'];
            abort_unless($this->hasProjectAccess($authUser->isAdmin() ? $authUser : $targetUser, $projectId), 422, 'Choose a project assigned to this workspace.');
            abort_if(
                $authUser->isAdmin() && !Project::where('id', $projectId)->whereHas('members', fn($q) => $q->where('users.id', $targetUser->id))->exists(),
                422,
                'Assign tasks only to users who are members of the selected project folder.'
            );

            $task = $targetUser->tasks()->create([
                'title'           => $taskData['title'],
                'description'     => $taskData['description'] ?? null,
                'priority'        => $taskData['priority'],
                'status'          => $taskData['status'],
                'due_date'        => $taskData['due_date'] ?: null,
                'due_time'        => $taskData['due_time'] ?: null,
                'project_id'      => $projectId,
                'max_submissions' => $taskData['max_submissions'] ?? null,
            ]);

            // Handle file attachments uploaded with this task
            $uploadedFiles = $request->file("files.{$index}") ?? [];
            if (!is_array($uploadedFiles)) {
                $uploadedFiles = [$uploadedFiles];
            }
            foreach ($uploadedFiles as $file) {
                if (!$file || !$file->isValid()) continue;
                $projectFolder = $task->project_id ? "projects/{$task->project_id}" : 'projects/unassigned';
                $path = $file->store("{$projectFolder}/tasks/{$task->id}/attachments", 'local');
                if ($path) {
                    $task->attachments()->create([
                        'user_id'       => $authUser->id,
                        'project_id'    => $task->project_id,
                        'original_name' => $file->getClientOriginalName(),
                        'path'          => $path,
                        'mime_type'     => $file->getMimeType(),
                        'size'          => $file->getSize(),
                    ]);
                }
            }

            // Notify the assigned user (skip if admin assigned to themselves)
            if ($targetUser->id !== $authUser->id) {
                TaskNotification::create([
                    'user_id' => $targetUser->id,
                    'task_id' => $task->id,
                    'type'    => 'assigned',
                ]);

                $projectName = $task->project?->name;
                Mail::raw(
                    "Hi {$targetUser->name},\n\n"
                    . "A new task has been assigned to you in TaskHive.\n\n"
                    . "Title: {$task->title}\n"
                    . ($projectName ? "Project: {$projectName}\n" : "")
                    . "Due Date: " . ($task->due_date?->format('Y-m-d') ?? 'N/A') . "\n\n"
                    . "Please log in to TaskHive to view details.",
                    function ($message) use ($targetUser, $task) {
                        $message->to($targetUser->email)
                            ->subject("New Task Assigned: {$task->title}");
                    }
                );
            }
        }

        $count = count($request->input('tasks'));
        $message = $count === 1 ? 'Task created successfully.' : "{$count} tasks created successfully.";

        return redirect()->route('tasks.index')->with('success', $message);
    }

    public function storeGroup(Request $request)
    {
        /** @var User $authUser */
        $authUser = Auth::user();
        abort_if(!$authUser->isAdmin(), 403, 'Only admins can create group tasks.');

        $request->validate([
            'tasks'              => 'required|array|min:1',
            'tasks.*.title'      => 'required|string|max:255',
            'tasks.*.description' => 'nullable|string',
            'tasks.*.priority'   => 'required|in:low,medium,high',
            'tasks.*.due_date'   => 'nullable|date',
            'tasks.*.due_time'   => 'nullable|date_format:H:i',
            'tasks.*.project_id' => 'required|exists:projects,id',
            'tasks.*.assign_to'  => 'required|exists:users,id',
            'tasks.*.status'     => 'nullable|in:todo,in_progress,done',
            'submission_mode'    => 'nullable|in:manual,voting',
            'leader_user_id'     => 'nullable|exists:users,id',
        ]);

        $groupId       = (string) Str::uuid();
        $submissionMode = $request->input('submission_mode', 'manual');
        $leaderUserId  = $request->input('leader_user_id');

        $projectId = null;
        foreach ($request->input('tasks') as $taskData) {
            /** @var User $targetUser */
            $targetUser = User::findOrFail($taskData['assign_to']);
            abort_if($targetUser->admin_id !== $authUser->id, 403, 'Choose users connected to your workspace.');
            abort_if(
                !Project::where('id', (int) $taskData['project_id'])->whereHas('members', fn($q) => $q->where('users.id', $targetUser->id))->exists(),
                422,
                'Assign group tasks only to users who are members of the selected project folder.'
            );

            $task = $targetUser->tasks()->create([
                'title'           => $taskData['title'],
                'description'     => $taskData['description'] ?? null,
                'priority'        => $taskData['priority'],
                'status'          => $taskData['status'] ?? 'todo',
                'due_date'        => $taskData['due_date'] ?: null,
                'due_time'        => $taskData['due_time'] ?: null,
                'project_id'      => (int) $taskData['project_id'],
                'group_id'        => $groupId,
                'submission_mode' => $submissionMode,
                'leader_user_id'  => $leaderUserId ?: null,
            ]);

            $projectId = $task->project_id;

            TaskNotification::create([
                'user_id' => $targetUser->id,
                'task_id' => $task->id,
                'type'    => 'assigned',
            ]);
        }

        $count = count($request->input('tasks'));
        return back()->with('success', "Group task created for {$count} user" . ($count !== 1 ? 's' : '') . '.');
    }

    public function edit(Task $task)
    {
        /** @var User $user */
        $user = Auth::user();
        abort_if($task->user_id !== Auth::id() && !$user->isAdmin(), 403);
        abort_if($user->isAdmin() && !$user->workspaceUserIds()->contains($task->user_id), 403);

        if ($task->status === 'done' && !$user->isAdmin()) {
            return redirect()->route('tasks.index')
                ->with('error', 'This task is closed. Ask an admin to reopen it first.');
        }

        $projects = $this->userProjects();
        $task->load(['comments.user', 'attachments.user', 'submissions.user', 'submissions.files', 'leader', 'votes']);
        $users = $user->isAdmin() ? $user->managedUsers()->orderBy('name')->get(['id','name']) : collect();

        // For group tasks, find all group members (users whose tasks share same group_id)
        $groupMembers = [];
        if ($task->group_id) {
            $groupMembers = Task::where('group_id', $task->group_id)
                ->with('user:id,name')
                ->get()
                ->map(fn($t) => ['id' => $t->user_id, 'name' => $t->user?->name, 'task_id' => $t->id])
                ->unique('id')
                ->values()
                ->all();
        }

        return Inertia::render('Tasks/Edit', [
            'task'     => [
                'id'               => $task->id,
                'title'            => $task->title,
                'description'      => $task->description,
                'priority'         => $task->priority,
                'status'           => $task->status,
                'due_date'         => $task->due_date?->format('Y-m-d'),
                'due_time'         => $task->due_time,
                'project_id'       => $task->project_id,
                'user_id'          => $task->user_id,
                'max_submissions'  => $task->max_submissions,
                'submissions_count'=> $task->submissions_count,
                'group_id'         => $task->group_id,
                'submission_mode'  => $task->submission_mode ?? 'manual',
                'leader'           => $task->leader ? ['id' => $task->leader->id, 'name' => $task->leader->name] : null,
                'vote_counts'      => $task->votes->countBy('candidate_user_id')->all(),
                'my_vote'          => $task->votes->firstWhere('voter_user_id', $user->id)?->candidate_user_id,
                'comments'         => $task->comments->map(fn($c) => [
                    'id'         => $c->id,
                    'body'       => $c->body,
                    'created_at' => $c->created_at->diffForHumans(),
                    'user'       => ['id' => $c->user->id, 'name' => $c->user->name, 'is_admin' => $c->user->isAdmin()],
                ]),
                'attachments'      => $task->attachments->map(fn($a) => [
                    'id'            => $a->id,
                    'original_name' => $a->original_name,
                    'size'          => $a->size,
                    'mime_type'     => $a->mime_type,
                    'created_at'    => $a->created_at->diffForHumans(),
                    'user'          => ['id' => $a->user->id, 'name' => $a->user->name],
                    'preview_url'   => str_starts_with((string) $a->mime_type, 'image/') || $a->mime_type === 'application/pdf'
                        ? route('tasks.attachments.preview', [$task->id, $a->id])
                        : null,
                    'download_url'  => route('tasks.attachments.download', [$task->id, $a->id]),
                ]),
                'submissions'      => $task->submissions->map(fn($s) => [
                    'id'            => $s->id,
                    'comment'       => $s->comment,
                    'original_name' => $s->original_name,
                    'attempt'       => $s->attempt,
                    'created_at'    => $s->created_at->format('M j, Y g:i A'),
                    'user'          => ['id' => $s->user->id, 'name' => $s->user->name],
                    'download_url'  => $s->file_path ? route('tasks.submissions.download', [$task->id, $s->id]) : null,
                    'files'         => $s->files->map(fn($f) => [
                        'id'            => $f->id,
                        'original_name' => $f->original_name,
                        'size'          => $f->size,
                        'mime_type'     => $f->mime_type,
                        'preview_url'   => str_starts_with((string) $f->mime_type, 'image/') || $f->mime_type === 'application/pdf'
                            ? route('tasks.submissions.files.preview', [$task->id, $s->id, $f->id])
                            : null,
                        'download_url'  => route('tasks.submissions.files.download', [$task->id, $s->id, $f->id]),
                    ]),
                ]),
            ],
            'projects'     => $projects->map(fn($p) => ['id' => $p->id, 'name' => $p->name]),
            'users'        => $users->map(fn($u) => ['id' => $u->id, 'name' => $u->name]),
            'groupMembers' => $groupMembers,
            'isAdmin'      => $user->isAdmin(),
            'authId'       => Auth::id(),
        ]);
    }

    public function update(Request $request, Task $task)
    {
        /** @var User $user */
        $user = Auth::user();
        abort_if($task->user_id !== Auth::id() && !$user->isAdmin(), 403);
        abort_if($user->isAdmin() && !$user->workspaceUserIds()->contains($task->user_id), 403);

        if ($task->status === 'done' && !$user->isAdmin()) {
            return redirect()->route('tasks.index')
                ->with('error', 'This task is closed. Ask an admin to reopen it first.');
        }

        if ($user->isAdmin()) {
            $validated = $request->validate([
                'title'           => 'required|string|max:255',
                'description'     => 'nullable|string',
                'priority'        => 'required|in:low,medium,high',
                'status'          => 'required|in:todo,in_progress,done',
                'due_date'        => 'nullable|date',
                'due_time'        => 'nullable|date_format:H:i',
                'project_id'      => 'required|exists:projects,id',
                'max_submissions' => 'nullable|integer|min:1',
                'user_id'         => 'nullable|exists:users,id',
            ]);
        } else {
            $validated = $request->validate([
                'status' => 'required|in:todo,in_progress,done',
            ]);
        }

        if ($user->isAdmin()) {
            $targetUser = !empty($validated['user_id'])
                ? User::findOrFail($validated['user_id'])
                : $task->user;
            $projectId = (int) $validated['project_id'];
            abort_if($targetUser->admin_id !== $user->id, 403, 'Choose a user connected to your workspace.');
            abort_unless($this->hasProjectAccess($user, $projectId), 422, 'Choose a project assigned to your workspace.');
            abort_unless(Project::where('id', $projectId)->whereHas('members', fn($q) => $q->where('users.id', $targetUser->id))->exists(), 422, 'Assign tasks only to users who are members of the selected project folder.');
        }

        $task->update($validated);

        return redirect()->route('tasks.index')->with('success', 'Task updated successfully.');
    }

    public function destroy(Task $task)
    {
        /** @var User $user */
        $user = Auth::user();
        // Only admins can delete tasks
        abort_if(!$user->isAdmin(), 403);
        abort_if(!$user->workspaceUserIds()->contains($task->user_id), 403);
        $task->delete();
        return redirect()->route('tasks.index')->with('success', 'Task deleted successfully.');
    }

    public function toggleStatus(Request $request, Task $task)
    {
        /** @var User $user */
        $user = Auth::user();
        abort_if($task->user_id !== Auth::id() && !$user->isAdmin(), 403);
        abort_if($user->isAdmin() && !$user->workspaceUserIds()->contains($task->user_id), 403);
        // Non-admins cannot reopen a completed task
        abort_if($task->status === 'done' && !$user->isAdmin(), 403);
        // Non-admins cannot toggle overdue (missing) tasks
        $isOverdue = $task->status !== 'done'
            && $task->due_date
            && $task->due_date->lt(now()->startOfDay());
        abort_if($isOverdue && !$user->isAdmin(), 403);
        $nextStatus = match($task->status) {
            'todo'        => 'in_progress',
            'in_progress' => 'done',
            'done'        => 'todo',
        };

        $payload = ['status' => $nextStatus];

        // Non-admins must choose which project folder the task goes to when marking done.
        if (!$user->isAdmin() && $nextStatus === 'done') {
            $validated = $request->validate([
                'project_id' => 'required|exists:projects,id',
            ]);

            abort_unless($this->hasProjectAccess($user, (int) $validated['project_id']), 422, 'Choose one of your project folders.');

            $payload['project_id'] = $validated['project_id'];
        }

        $task->update($payload);
        return redirect()->route('tasks.index')->with('success', 'Task status updated.');
    }

    public function requestReopen(Request $request, Task $task)
    {
        /** @var User $user */
        $user = Auth::user();

        abort_if($user->isAdmin(), 403, 'Admins do not need reopen requests.');
        abort_if($task->user_id !== $user->id, 403);

        $isOverdue = $task->status !== 'done'
            && $task->due_date
            && $task->due_date->lt(now()->startOfDay());
        $isDone = $task->status === 'done';

        abort_unless($isOverdue || $isDone, 422, 'Reopen request is only available for missed or completed tasks.');

        $data = $request->validate([
            'comment' => 'required|string|max:1000',
        ]);

        // Keep a trace of the reopen request on the task timeline.
        $task->comments()->create([
            'user_id' => $user->id,
            'body' => 'Reopen request: ' . trim($data['comment']),
        ]);

        $admins = User::whereKey($user->admin_id)->whereNotNull('email')->get();
        if ($admins->isEmpty()) {
            return back()->with('error', 'No admin email is available right now.');
        }

        foreach ($admins as $admin) {
            TaskNotification::create([
                'user_id' => $admin->id,
                'task_id' => $task->id,
                'type'    => 'reopen_request',
            ]);

            Mail::raw(
                "Hi {$admin->name},\n\n"
                . "{$user->name} requested to reopen a task in TaskHive.\n\n"
                . "Task: {$task->title}\n"
                . "Current Status: {$task->status}\n"
                . "Due Date: " . ($task->due_date?->format('Y-m-d') ?? 'N/A') . "\n"
                . "Requested By: {$user->name} ({$user->email})\n\n"
                . "Comment:\n{$data['comment']}\n\n"
                . "Please review and update the task.",
                function ($message) use ($admin, $task) {
                    $message->to($admin->email)
                        ->subject("Reopen Request: {$task->title}");
                }
            );
        }

        return back()->with('success', 'Reopen request sent to admin.');
    }

    public function submit(Request $request, Task $task)
    {
        /** @var User $user */
        $user = Auth::user();

        abort_if($task->user_id !== $user->id && !$user->isAdmin(), 403);
        abort_if($user->isAdmin() && !$user->workspaceUserIds()->contains($task->user_id), 403);

        // For group tasks, only the designated leader may submit
        if ($task->group_id && $task->leader_user_id && $task->leader_user_id !== $user->id && !$user->isAdmin()) {
            return back()->with('error', 'Only the designated leader can submit this group task.');
        }

        // Check submission limit
        if ($task->max_submissions !== null && $task->submissions_count >= $task->max_submissions) {
            return back()->with('error', 'Submission limit reached for this task.');
        }

        $validated = $request->validate([
            'comment' => 'nullable|string|max:2000',
            'file'    => 'nullable|file|max:51200',
            'files'   => 'nullable|array|max:10',
            'files.*' => 'file|max:51200',
            'project_id' => 'nullable|exists:projects,id',
        ]);

        if (!$task->project_id) {
            abort_unless(!empty($validated['project_id']), 422, 'Select a project folder for this submission.');
            abort_unless($this->hasProjectAccess($user, (int) $validated['project_id']), 422, 'Choose one of your project folders.');
            $task->update(['project_id' => (int) $validated['project_id']]);
        }

        $filePath     = null;
        $originalName = null;
        $mimeType     = null;
        $size         = null;

        $uploadedFiles = $request->file('files', []);
        if ($request->hasFile('file')) {
            array_unshift($uploadedFiles, $request->file('file'));
        }

        if (!is_array($uploadedFiles)) {
            $uploadedFiles = [$uploadedFiles];
        }

        $task->increment('submissions_count');

        $submission = TaskSubmission::create([
            'task_id'       => $task->id,
            'user_id'       => $user->id,
            'project_id'    => $task->project_id,
            'comment'       => $request->input('comment'),
            'file_path'     => $filePath,
            'original_name' => $originalName,
            'mime_type'     => $mimeType,
            'size'          => $size,
            'attempt'       => $task->submissions_count,
        ]);

        foreach ($uploadedFiles as $file) {
            if (!$file || !$file->isValid()) continue;

            $projectFolder = $task->project_id ? "projects/{$task->project_id}" : 'projects/unassigned';
            $path = $file->store("{$projectFolder}/tasks/{$task->id}/submissions/attempt-{$submission->attempt}", 'public');

            $submission->files()->create([
                'task_id'       => $task->id,
                'project_id'    => $task->project_id,
                'user_id'       => $user->id,
                'path'          => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type'     => $file->getMimeType(),
                'size'          => $file->getSize(),
            ]);

            if ($filePath === null) {
                $filePath     = $path;
                $originalName = $file->getClientOriginalName();
                $mimeType     = $file->getMimeType();
                $size         = $file->getSize();
            }
        }

        if ($filePath !== null) {
            $submission->update([
                'file_path'     => $filePath,
                'original_name' => $originalName,
                'mime_type'     => $mimeType,
                'size'          => $size,
            ]);
        }

        $task->update(['status' => 'done']);

        // Notify admins of submission
        $admins = $user->isAdmin()
            ? collect([$user])
            : User::whereKey($user->admin_id)->get();
        foreach ($admins as $admin) {
            TaskNotification::create([
                'user_id' => $admin->id,
                'task_id' => $task->id,
                'type'    => 'submission',
            ]);
        }

        return back()->with('success', $task->submissions_count === 1 ? 'Task submitted successfully.' : 'Task resubmitted successfully.');
    }

    public function downloadSubmission(Task $task, TaskSubmission $submission)
    {
        abort_if(!$submission->file_path, 404);
        abort_if($submission->task_id !== $task->id, 404);

        /** @var User $user */
        $user = Auth::user();
        abort_if($task->user_id !== $user->id && !$user->isAdmin(), 403);
        abort_if($user->isAdmin() && !$user->workspaceUserIds()->contains($task->user_id), 403);

        return response()->download(Storage::disk('public')->path($submission->file_path), $submission->original_name);
    }

    public function previewSubmissionFile(Task $task, TaskSubmission $submission, TaskSubmissionFile $file)
    {
        $this->authorizeSubmissionFileAccess($task, $submission, $file);
        abort_unless(str_starts_with((string) $file->mime_type, 'image/') || $file->mime_type === 'application/pdf', 404);

        return response()->file(Storage::disk('public')->path($file->path), [
            'Content-Type' => $file->mime_type,
            'Content-Disposition' => 'inline; filename="'.$file->original_name.'"',
        ]);
    }

    public function downloadSubmissionFile(Task $task, TaskSubmission $submission, TaskSubmissionFile $file)
    {
        $this->authorizeSubmissionFileAccess($task, $submission, $file);

        return response()->download(Storage::disk('public')->path($file->path), $file->original_name);
    }

    private function authorizeSubmissionFileAccess(Task $task, TaskSubmission $submission, TaskSubmissionFile $file): void
    {
        abort_if($submission->task_id !== $task->id, 404);
        abort_if($file->task_submission_id !== $submission->id || $file->task_id !== $task->id, 404);

        /** @var User $user */
        $user = Auth::user();
        abort_if($task->user_id !== $user->id && !$user->isAdmin(), 403);
        abort_if($user->isAdmin() && !$user->workspaceUserIds()->contains($task->user_id), 403);
    }

    public function assignLeader(Request $request, Task $task)
    {
        /** @var User $user */
        $user = Auth::user();
        abort_if(!$user->isAdmin(), 403, 'Only admins can assign a leader.');
        abort_if(!$user->workspaceUserIds()->contains($task->user_id), 403);

        $data = $request->validate([
            'leader_user_id'  => 'nullable|exists:users,id',
            'submission_mode' => 'nullable|in:manual,voting',
        ]);

        // Apply to all tasks sharing the same group_id, or just this task
        $query = $task->group_id
            ? Task::where('group_id', $task->group_id)
            : Task::where('id', $task->id);

        $query->update([
            'leader_user_id'  => $data['leader_user_id'] ?? null,
            'submission_mode' => $data['submission_mode'] ?? $task->submission_mode,
        ]);

        return back()->with('success', 'Leader updated successfully.');
    }

    public function castVote(Request $request, Task $task)
    {
        /** @var User $user */
        $user = Auth::user();

        // Only group members (users assigned to a task in the same group) can vote
        abort_unless($task->group_id, 403, 'This task does not support voting.');
        abort_unless($task->submission_mode === 'voting', 403, 'Voting is not enabled for this task.');

        $isGroupMember = Task::where('group_id', $task->group_id)
            ->where('user_id', $user->id)->exists();
        abort_if(!$isGroupMember && !$user->isAdmin(), 403, 'You are not a member of this group task.');

        $data = $request->validate([
            'candidate_user_id' => 'required|exists:users,id',
        ]);

        // Upsert: one vote per voter per group — use any task_id in the group for this voter's record
        // We tie the vote to the task the voter owns within the group
        $voterTask = Task::where('group_id', $task->group_id)
            ->where('user_id', $user->id)
            ->firstOr(fn() => $task);

        TaskVote::updateOrCreate(
            ['task_id' => $voterTask->id, 'voter_user_id' => $user->id],
            ['candidate_user_id' => $data['candidate_user_id']]
        );

        // Count votes across entire group for each candidate
        $groupTaskIds = Task::where('group_id', $task->group_id)->pluck('id');
        $totalMembers  = $groupTaskIds->count();
        $voteCounts    = TaskVote::whereIn('task_id', $groupTaskIds)
            ->selectRaw('candidate_user_id, count(*) as total')
            ->groupBy('candidate_user_id')
            ->pluck('total', 'candidate_user_id');

        // Auto-promote if a candidate gets strict majority
        $majority = (int) ceil($totalMembers / 2);
        $winner   = $voteCounts->filter(fn($count) => $count >= $majority)->keys()->first();

        if ($winner) {
            Task::where('group_id', $task->group_id)
                ->update(['leader_user_id' => $winner]);
        }

        return back()->with('success', 'Vote cast successfully.');
    }
}
