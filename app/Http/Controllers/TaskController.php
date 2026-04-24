<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        return Inertia::render('Tasks/Index', [
            'tasks' => $tasks->map(fn($t) => [
                'id'          => $t->id,
                'title'       => $t->title,
                'description' => $t->description,
                'priority'    => $t->priority,
                'status'      => $t->status,
                'due_date'    => $t->due_date?->format('Y-m-d'),
                'user'        => $t->relationLoaded('user') ? ['name' => $t->user?->name] : null,
                'is_overdue'  => $t->status !== 'done' && $t->due_date && $t->due_date->lt(now()->startOfDay()),
            ]),
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

            $targetUser->tasks()->create([
                'title'       => $taskData['title'],
                'description' => $taskData['description'] ?? null,
                'priority'    => $taskData['priority'],
                'status'      => $taskData['status'],
                'due_date'    => $taskData['due_date'] ?: null,
                'project_id'  => !empty($taskData['project_id']) ? $taskData['project_id'] : null,
            ]);
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
                    'user'       => ['id' => $c->user->id, 'name' => $c->user->name],
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
                'project_id'  => 'nullable|exists:projects,id',
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

    public function toggleStatus(Task $task)
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
        $task->update(['status' => $nextStatus]);
        return redirect()->route('tasks.index')->with('success', 'Task status updated.');
    }
}
