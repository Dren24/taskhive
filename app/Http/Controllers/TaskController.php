<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskNotification;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class TaskController extends Controller
{
    private function userProjects()
    {
        /** @var User $user */
        $user = Auth::user();
        return $user->projects()->orderBy('name')->get();
    }

    public function index()
    {
        /** @var User $user */
        $user = Auth::user();
        $tasks = $user->isAdmin()
            ? Task::with('user')->latest()->get()
            : $user->tasks()->latest()->get();

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
                'project_id'  => $t->project_id,
                'user'        => $t->relationLoaded('user') ? ['name' => $t->user?->name] : null,
                'is_overdue'  => $t->status !== 'done' && $t->due_date && $t->due_date->lt(now()->startOfDay()),
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
        $projects = $this->userProjects();
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
            'tasks'               => 'required|array|min:1',
            'tasks.*.title'       => 'required|string|max:255',
            'tasks.*.description' => 'nullable|string',
            'tasks.*.priority'    => 'required|in:low,medium,high',
            'tasks.*.status'      => 'required|in:todo,in_progress,done',
            'tasks.*.due_date'    => 'required|date',
            'tasks.*.project_id'  => 'nullable|exists:projects,id',
            'tasks.*.assign_to'   => $authUser->isAdmin() ? 'required|exists:users,id' : 'nullable|exists:users,id',
        ];

        $request->validate($rules);

        foreach ($request->input('tasks') as $taskData) {
            /** @var User $targetUser */
            $targetUser = ($authUser->isAdmin() && !empty($taskData['assign_to']))
                ? User::findOrFail($taskData['assign_to'])
                : $authUser;

            $task = $targetUser->tasks()->create([
                'title'       => $taskData['title'],
                'description' => $taskData['description'] ?? null,
                'priority'    => $taskData['priority'],
                'status'      => $taskData['status'],
                'due_date'    => $taskData['due_date'] ?: null,
                'project_id'  => $taskData['project_id'] ?: null,
            ]);

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

        $isOverdue = $task->status !== 'done'
            && $task->due_date
            && $task->due_date->lt(now()->startOfDay());
        if ($isOverdue && !$user->isAdmin()) {
            return redirect()->route('tasks.index')
                ->with('error', 'This task is overdue and cannot be edited.');
        }

        $projects = $this->userProjects();
        $task->load('comments.user');
        return Inertia::render('Tasks/Edit', [
            'task'     => [
                'id'          => $task->id,
                'title'       => $task->title,
                'description' => $task->description,
                'priority'    => $task->priority,
                'status'      => $task->status,
                'due_date'    => $task->due_date?->format('Y-m-d'),
                'project_id'  => $task->project_id,
                'comments'    => $task->comments->map(fn($c) => [
                    'id'         => $c->id,
                    'body'       => $c->body,
                    'created_at' => $c->created_at->diffForHumans(),
                    'user'       => ['id' => $c->user->id, 'name' => $c->user->name, 'is_admin' => $c->user->isAdmin()],
                ]),
            ],
            'projects' => $projects->map(fn($p) => ['id' => $p->id, 'name' => $p->name]),
            'isAdmin'  => $user->isAdmin(),
            'authId'   => Auth::id(),
        ]);
    }

    public function update(Request $request, Task $task)
    {
        /** @var User $user */
        $user = Auth::user();
        abort_if($task->user_id !== Auth::id() && !$user->isAdmin(), 403);

        $isOverdue = $task->status !== 'done'
            && $task->due_date
            && $task->due_date->lt(now()->startOfDay());
        if ($isOverdue && !$user->isAdmin()) {
            return redirect()->route('tasks.index')
                ->with('error', 'This task is overdue and cannot be edited.');
        }

        if ($user->isAdmin()) {
            $validated = $request->validate([
                'title'       => 'required|string|max:255',
                'description' => 'nullable|string',
                'priority'    => 'required|in:low,medium,high',
                'status'      => 'required|in:todo,in_progress,done',
                'due_date'    => 'nullable|date',
                'project_id'  => 'required|exists:projects,id',
            ]);
        } else {
            $validated = $request->validate([
                'status' => 'required|in:todo,in_progress,done',
            ]);
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

            $ownsProject = Project::where('id', $validated['project_id'])
                ->where('user_id', $user->id)
                ->exists();
            abort_unless($ownsProject, 422, 'Choose one of your project folders.');

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
}
