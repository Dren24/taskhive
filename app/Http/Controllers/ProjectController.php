<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProjectController extends Controller
{
    public function index()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $projects = $user->projects()->withCount('tasks')->latest()->get();

        return view('projects.index', compact('projects'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'  => 'required|string|max:255',
            'color' => 'required|in:purple,blue,green,rose,amber,indigo',
        ]);

        Auth::user()->projects()->create($data);

        return back()->with('success', 'Project created.');
    }

    public function destroy(Project $project)
    {
        abort_if($project->user_id !== Auth::id(), 403);
        $project->delete();

        return back()->with('success', 'Project deleted.');
    }
}
