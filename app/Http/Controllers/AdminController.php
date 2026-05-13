<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function index()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        abort_if(!$user->isAdmin(), 403);

        $users = User::where('role', 'user')
            ->withCount('tasks')
            ->orderBy('name')
            ->get();

        $tasks = Task::with(['user', 'project'])
            ->latest()
            ->get();

        $today = now()->startOfDay();
        $stats = [
            'users'   => $users->count(),
            'total'   => $tasks->count(),
            'active'  => $tasks->whereIn('status', ['todo', 'in_progress'])->count(),
            'done'    => $tasks->where('status', 'done')->count(),
            'overdue' => $tasks->filter(fn($t) => $t->status !== 'done' && $t->due_date && $t->due_date->lt($today))->count(),
        ];

        return Inertia::render('Admin/Index', [
            'users' => $users->map(fn($u) => [
                'id'          => $u->id,
                'name'        => $u->name,
                'email'       => $u->email,
                'tasks_count' => $u->tasks_count,
            ]),
            'tasks' => $tasks->map(fn($t) => [
                'id'         => $t->id,
                'title'      => $t->title,
                'priority'   => $t->priority,
                'status'     => $t->status,
                'due_date'   => $t->due_date?->format('Y-m-d'),
                'is_overdue' => $t->status !== 'done' && $t->due_date && $t->due_date->lt($today),
                'user'       => $t->user ? ['id' => $t->user->id, 'name' => $t->user->name] : null,
                'project'    => $t->project ? ['name' => $t->project->name] : null,
            ]),
            'stats' => $stats,
        ]);
    }

    public function destroyTask(Task $task)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        abort_if(!$user->isAdmin(), 403);
        $task->delete();
        return back()->with('success', 'Task deleted successfully.');
    }

    public function updateTaskStatus(Task $task)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        abort_if(!$user->isAdmin(), 403);

        $action = request('action');

        if ($action === 'close') {
            $task->update(['status' => 'done']);
            return back()->with('success', 'Task closed.');
        }

        if ($action === 'reopen') {
            $task->update(['status' => 'todo']);
            return back()->with('success', 'Task reopened.');
        }

        return back()->with('error', 'Invalid action.');
    }
}
