<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CommentController extends Controller
{
    public function store(Request $request, Task $task)
    {
        $request->validate([
            'body' => 'required|string|max:2000',
        ]);

        $task->comments()->create([
            'user_id' => Auth::id(),
            'body'    => $request->body,
        ]);

        return back()->with('success', 'Comment added.');
    }

    public function destroy(Task $task, Comment $comment)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Only the comment author or an admin can delete
        abort_unless($user->isAdmin() || $comment->user_id === $user->id, 403);

        $comment->delete();

        return back()->with('success', 'Comment deleted.');
    }
}
