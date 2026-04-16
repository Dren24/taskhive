<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskController extends Controller
{
    public function index()
    {
        /** @var User $user */
        $user = Auth::user();
        $tasks = $user->tasks()->latest()->get();
        return view('tasks.index', compact('tasks'));
    }

    public function create()
    {
        return view('tasks.create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority'    => 'required|in:low,medium,high',
            'status'      => 'required|in:todo,in_progress,done',
            'due_date'    => 'nullable|date',
        ]);

        /** @var User $user */
        $user = Auth::user();
        $user->tasks()->create($validated);

        return redirect()->route('tasks.index')->with('success', 'Task created successfully.');
    }

    public function edit(Task $task)
    {
        abort_if($task->user_id !== Auth::id(), 403);
        return view('tasks.edit', compact('task'));
    }

    public function update(Request $request, Task $task)
    {
        abort_if($task->user_id !== Auth::id(), 403);

        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority'    => 'required|in:low,medium,high',
            'status'      => 'required|in:todo,in_progress,done',
            'due_date'    => 'nullable|date',
        ]);

        $task->update($validated);

        return redirect()->route('tasks.index')->with('success', 'Task updated successfully.');
    }

    public function destroy(Task $task)
    {
        abort_if($task->user_id !== Auth::id(), 403);
        $task->delete();
        return redirect()->route('tasks.index')->with('success', 'Task deleted successfully.');
    }

    public function toggleStatus(Task $task)
    {
        abort_if($task->user_id !== Auth::id(), 403);
        $nextStatus = match($task->status) {
            'todo'        => 'in_progress',
            'in_progress' => 'done',
            'done'        => 'todo',
        };
        $task->update(['status' => $nextStatus]);
        return redirect()->route('tasks.index')->with('success', 'Task status updated.');
    }
}
