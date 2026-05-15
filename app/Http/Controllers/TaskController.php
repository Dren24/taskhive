<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskNotification;
use App\Models\TaskSubmission;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class TaskController extends Controller
{
    private function userProjects(?User $user = null)
    {
        /** @var User $user */
        $user = $user ?? Auth::user();

        if ($user->isAdmin()) {
            return Project::orderBy('name')->get();
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
            return Project::where('id', $projectId)->exists();
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
            ? Task::with(['user', 'comments.user', 'attachments.user', 'submissions.user'])->withCount('comments')->latest()->get()
            : $user->tasks()->with(['comments.user', 'attachments.user', 'submissions.user'])->withCount('comments')->latest()->get();

        $projectOptions = $user->isAdmin()
            ? Project::orderBy('name')->get(['id', 'name'])
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
            ? User::where('role', 'user')->orderBy('name')->get()
            : collect();
        return Inertia::render('Tasks/Create', [
            'projects' => $projects->map(fn($p) => ['id' => $p->id, 'name' => $p->name]),
            'users'    => $users->map(fn($u) => ['id' => $u->id, 'name' => $u->name]),
            'isAdmin'  => $user->isAdmin(),
            'authId'   => $user->id,
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
            'files.*.*'                => 'nullable|file|max:20480',
        ];

        $request->validate($rules);

        foreach ($request->input('tasks') as $index => $taskData) {
            /** @var User $targetUser */
            $targetUser = ($authUser->isAdmin() && !empty($taskData['assign_to']))
                ? User::findOrFail($taskData['assign_to'])
                : $authUser;

            $projectId = (int) $taskData['project_id'];
            abort_unless($this->hasProjectAccess($targetUser, $projectId), 422, 'Choose a project assigned to the user.');

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
            if ($request->hasFile("files.{$index}")) {
                foreach ($request->file("files.{$index}") as $file) {
                    $projectFolder = $task->project_id ? "projects/{$task->project_id}" : 'projects/unassigned';
                    $path = $file->store("{$projectFolder}/tasks/{$task->id}/attachments", 'local');
                    $task->attachments()->create([
                        'user_id'       => $authUser->id,
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

    public function edit(Task $task)
    {
        /** @var User $user */
        $user = Auth::user();
        abort_if($task->user_id !== Auth::id() && !$user->isAdmin(), 403);

        if ($task->status === 'done' && !$user->isAdmin()) {
            return redirect()->route('tasks.index')
                ->with('error', 'This task is closed. Ask an admin to reopen it first.');
        }

        $projects = $this->userProjects();
        $task->load(['comments.user', 'attachments.user']);
        $users = $user->isAdmin() ? User::orderBy('name')->get(['id','name']) : collect();
        return Inertia::render('Tasks/Edit', [
            'task'     => [
                'id'              => $task->id,
                'title'           => $task->title,
                'description'     => $task->description,
                'priority'        => $task->priority,
                'status'          => $task->status,
                'due_date'        => $task->due_date?->format('Y-m-d'),
                'due_time'        => $task->due_time,
                'project_id'      => $task->project_id,
                'user_id'         => $task->user_id,
                'max_submissions' => $task->max_submissions,
                'submissions_count' => $task->submissions_count,
                'comments'        => $task->comments->map(fn($c) => [
                    'id'         => $c->id,
                    'body'       => $c->body,
                    'created_at' => $c->created_at->diffForHumans(),
                    'user'       => ['id' => $c->user->id, 'name' => $c->user->name, 'is_admin' => $c->user->isAdmin()],
                ]),
                'attachments'     => $task->attachments->map(fn($a) => [
                    'id'            => $a->id,
                    'original_name' => $a->original_name,
                    'size'          => $a->size,
                    'mime_type'     => $a->mime_type,
                    'created_at'    => $a->created_at->diffForHumans(),
                    'user'          => ['id' => $a->user->id, 'name' => $a->user->name],
                    'download_url'  => route('tasks.attachments.download', [$task->id, $a->id]),
                ]),
            ],
            'projects' => $projects->map(fn($p) => ['id' => $p->id, 'name' => $p->name]),
            'users'    => $users->map(fn($u) => ['id' => $u->id, 'name' => $u->name]),
            'isAdmin'  => $user->isAdmin(),
            'authId'   => Auth::id(),
        ]);
    }

    public function update(Request $request, Task $task)
    {
        /** @var User $user */
        $user = Auth::user();
        abort_if($task->user_id !== Auth::id() && !$user->isAdmin(), 403);

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
                'title'       => 'required|string|max:255',
                'description' => 'nullable|string',
                'priority'    => 'required|in:low,medium,high',
                'status'      => 'required|in:todo,in_progress,done',
            ]);
        }

        if ($user->isAdmin()) {
            $targetUser = !empty($validated['user_id'])
                ? User::findOrFail($validated['user_id'])
                : $task->user;
            $projectId = (int) $validated['project_id'];
            abort_unless($this->hasProjectAccess($targetUser, $projectId), 422, 'Choose a project assigned to the user.');
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
        $task->delete();
        return redirect()->route('tasks.index')->with('success', 'Task deleted successfully.');
    }

    public function toggleStatus(Request $request, Task $task)
    {
        /** @var User $user */
        $user = Auth::user();
        abort_if($task->user_id !== Auth::id() && !$user->isAdmin(), 403);
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

        $admins = User::where('role', 'admin')->whereNotNull('email')->get();
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

        // Check submission limit
        if ($task->max_submissions !== null && $task->submissions_count >= $task->max_submissions) {
            return back()->with('error', 'Submission limit reached for this task.');
        }

        $validated = $request->validate([
            'comment' => 'nullable|string|max:2000',
            'file'    => 'nullable|file|max:20480', // 20 MB max
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

        if ($request->hasFile('file')) {
            $file         = $request->file('file');
            $projectFolder = $task->project_id ? "projects/{$task->project_id}" : 'projects/unassigned';
            $filePath     = $file->store("{$projectFolder}/tasks/{$task->id}/submissions", 'public');
            $originalName = $file->getClientOriginalName();
            $mimeType     = $file->getMimeType();
            $size         = $file->getSize();
        }

        $task->increment('submissions_count');

        TaskSubmission::create([
            'task_id'       => $task->id,
            'user_id'       => $user->id,
            'comment'       => $request->input('comment'),
            'file_path'     => $filePath,
            'original_name' => $originalName,
            'mime_type'     => $mimeType,
            'size'          => $size,
            'attempt'       => $task->submissions_count,
        ]);

        $task->update(['status' => 'done']);

        // Notify admins of submission
        $admins = User::where('role', 'admin')->get();
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

        return response()->download(Storage::disk('public')->path($submission->file_path), $submission->original_name);
    }
}
