<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskAttachment;
use App\Models\TaskNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class TaskAttachmentController extends Controller
{
    public function store(Request $request, Task $task)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Only the assigned user or admin can upload
        abort_if($task->user_id !== $user->id && !$user->isAdmin(), 403);

        $request->validate([
            'file' => 'nullable|file|max:51200',
            'files' => 'nullable|array|max:10',
            'files.*' => 'file|max:51200',
        ]);

        $uploadedFiles = $request->file('files', []);
        if ($request->hasFile('file')) {
            array_unshift($uploadedFiles, $request->file('file'));
        }

        abort_if(empty($uploadedFiles), 422, 'Choose at least one file to upload.');

        foreach ($uploadedFiles as $file) {
            if (!$file || !$file->isValid()) continue;

            $projectFolder = $task->project_id ? "projects/{$task->project_id}" : 'projects/unassigned';
            $path = $file->store("{$projectFolder}/tasks/{$task->id}/attachments", 'local');

            $task->attachments()->create([
                'user_id'       => $user->id,
                'project_id'    => $task->project_id,
                'original_name' => $file->getClientOriginalName(),
                'path'          => $path,
                'mime_type'     => $file->getMimeType(),
                'size'          => $file->getSize(),
            ]);
        }

        if ($user->isAdmin() && $task->user_id !== $user->id) {
            TaskNotification::create([
                'user_id' => $task->user_id,
                'task_id' => $task->id,
                'type'    => 'file_upload',
            ]);
        }

        return back()->with('success', count($uploadedFiles) === 1 ? 'File uploaded.' : 'Files uploaded.');
    }

    public function preview(Task $task, TaskAttachment $attachment)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        abort_if($task->user_id !== $user->id && !$user->isAdmin(), 403);
        abort_if($user->isAdmin() && !$user->workspaceUserIds()->contains($task->user_id), 403);
        abort_if($attachment->task_id !== $task->id, 404);
        abort_unless(str_starts_with((string) $attachment->mime_type, 'image/') || $attachment->mime_type === 'application/pdf', 404);

        return response()->file(Storage::disk('local')->path($attachment->path), [
            'Content-Type' => $attachment->mime_type,
            'Content-Disposition' => 'inline; filename="'.$attachment->original_name.'"',
        ]);
    }

    public function download(Task $task, TaskAttachment $attachment)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        abort_if($task->user_id !== $user->id && !$user->isAdmin(), 403);
        abort_if($attachment->task_id !== $task->id, 404);

        return Storage::disk('local')->download($attachment->path, $attachment->original_name);
    }

    public function destroy(Task $task, TaskAttachment $attachment)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        abort_if($attachment->task_id !== $task->id, 404);
        abort_if($attachment->user_id !== $user->id && !$user->isAdmin(), 403);

        Storage::disk('local')->delete($attachment->path);
        $attachment->delete();

        return back()->with('success', 'Attachment deleted.');
    }
}
