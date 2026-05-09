<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProjectCommentController extends Controller
{
    public function store(Request $request, Project $project)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        abort_unless($user->isAdmin() || $project->user_id === $user->id, 403);

        $request->validate([
            'body' => 'required|string|max:2000',
        ]);

        $project->comments()->create([
            'user_id' => $user->id,
            'body'    => $request->body,
        ]);

        return back()->with('success', 'Comment added.');
    }

    public function destroy(Project $project, ProjectComment $comment)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        abort_unless($user->isAdmin() || $comment->user_id === $user->id, 403);

        $comment->delete();

        return back()->with('success', 'Comment deleted.');
    }
}
