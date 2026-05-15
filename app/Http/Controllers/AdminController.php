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
            ->withCount('comments')
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
                'id'                => $t->id,
                'title'             => $t->title,
                'description'       => $t->description,
                'priority'          => $t->priority,
                'status'            => $t->status,
                'due_date'          => $t->due_date?->format('Y-m-d'),
                'due_time'          => $t->due_time,
                'is_overdue'        => $t->status !== 'done' && $t->due_date && $t->due_date->lt($today),
                'comments_count'    => $t->comments_count,
                'submissions_count' => $t->submissions_count,
                'max_submissions'   => $t->max_submissions,
                'user'              => $t->user ? ['id' => $t->user->id, 'name' => $t->user->name] : null,
                'project'           => $t->project ? ['id' => $t->project->id, 'name' => $t->project->name] : null,
            ]),
            'stats' => $stats,
        ]);
    }

    public function updateTask(Task $task)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        abort_if(!$user->isAdmin(), 403);

        $validated = request()->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority'    => 'required|in:low,medium,high',
            'status'      => 'required|in:todo,in_progress,done',
            'due_date'    => 'nullable|date',
            'due_time'    => 'nullable|date_format:H:i',
        ]);

        $task->update($validated);
        return back()->with('success', 'Task updated.');
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
