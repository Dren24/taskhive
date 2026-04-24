<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function index()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $projects = $user->projects()->withCount('tasks')->latest()->get();

        return Inertia::render('Projects/Index', [
            'projects' => $projects->map(fn($p) => [
                'id'          => $p->id,
                'name'        => $p->name,
                'color'       => $p->color,
                'tasks_count' => $p->tasks_count,
            ]),
            'isAdmin' => $user->isAdmin(),
        ]);
    }

    public function store(Request $request)
    {
        abort_if(!Auth::user()->isAdmin(), 403, 'Only admins can create projects.');
        $data = $request->validate([
            'name'  => 'required|string|max:255',
            'color' => 'required|in:purple,blue,green,rose,amber,indigo',
        ]);

        /** @var \App\Models\User $authUser */
        $authUser = Auth::user();
        $authUser->projects()->create($data);

        return back()->with('success', 'Project created.');
    }

    public function show(Project $project)
    {
        abort_if($project->user_id !== Auth::id(), 403);
        $tasks = $project->tasks()->latest()->get();
        return Inertia::render('Projects/Show', [
            'project' => ['id' => $project->id, 'name' => $project->name, 'color' => $project->color],
            'tasks'   => $tasks->map(fn($t) => [
                'id'       => $t->id,
                'title'    => $t->title,
                'status'   => $t->status,
                'priority' => $t->priority,
                'due_date' => $t->due_date?->format('Y-m-d'),
            ]),
        ]);
    }

    public function update(Request $request, Project $project)
    {
        abort_if(!Auth::user()->isAdmin(), 403, 'Only admins can update projects.');
        abort_if($project->user_id !== Auth::id(), 403);

        $data = $request->validate([
            'name'  => 'required|string|max:255',
            'color' => 'required|in:purple,blue,green,rose,amber,indigo',
        ]);

        $project->update($data);

        return back()->with('success', 'Project updated.');
    }

    public function destroy(Project $project)
    {
        abort_if(!Auth::user()->isAdmin(), 403, 'Only admins can delete projects.');
        abort_if($project->user_id !== Auth::id(), 403);
        $project->delete();

        return redirect()->route('projects.index')->with('success', 'Project deleted.');
    }
}
