<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProjectNotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectCommentController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskAttachmentController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

// Health check endpoint for Render (no auth, no CSRF, returns 200)
Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
})->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class]);
Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::delete('/profile/users/{user}', [ProfileController::class, 'destroyManagedUser'])->name('profile.users.destroy');

    Route::resource('tasks', TaskController::class);
    Route::post('tasks-group', [TaskController::class, 'storeGroup'])->name('tasks.store.group');
    Route::patch('tasks/{task}/toggle', [TaskController::class, 'toggleStatus'])->name('tasks.toggle');
    Route::post('tasks/{task}/request-reopen', [TaskController::class, 'requestReopen'])->name('tasks.request-reopen');
    Route::post('tasks/{task}/submit', [TaskController::class, 'submit'])->name('tasks.submit');
    Route::post('tasks/{task}/assign-leader', [TaskController::class, 'assignLeader'])->name('tasks.assign-leader');
    Route::post('tasks/{task}/vote', [TaskController::class, 'castVote'])->name('tasks.vote');
    Route::get('tasks/{task}/submissions/{submission}/files/{file}/preview', [TaskController::class, 'previewSubmissionFile'])->name('tasks.submissions.files.preview');
    Route::get('tasks/{task}/submissions/{submission}/files/{file}/download', [TaskController::class, 'downloadSubmissionFile'])->name('tasks.submissions.files.download');
    Route::get('tasks/{task}/submissions/{submission}/download', [TaskController::class, 'downloadSubmission'])->name('tasks.submissions.download');
    Route::post('tasks/{task}/attachments', [TaskAttachmentController::class, 'store'])->name('tasks.attachments.store');
    Route::get('tasks/{task}/attachments/{attachment}/preview', [TaskAttachmentController::class, 'preview'])->name('tasks.attachments.preview');
    Route::get('tasks/{task}/attachments/{attachment}/download', [TaskAttachmentController::class, 'download'])->name('tasks.attachments.download');
    Route::delete('tasks/{task}/attachments/{attachment}', [TaskAttachmentController::class, 'destroy'])->name('tasks.attachments.destroy');
    Route::post('tasks/{task}/comments', [CommentController::class, 'store'])->name('tasks.comments.store');
    Route::delete('tasks/{task}/comments/{comment}', [CommentController::class, 'destroy'])->name('tasks.comments.destroy');

    Route::get('projects', [ProjectController::class, 'index'])->name('projects.index');
    Route::post('projects', [ProjectController::class, 'store'])->name('projects.store');
    Route::get('projects/{project}', [ProjectController::class, 'show'])->name('projects.show');
    Route::patch('projects/{project}', [ProjectController::class, 'update'])->name('projects.update');
    Route::delete('projects/{project}', [ProjectController::class, 'destroy'])->name('projects.destroy');
    Route::post('projects/{project}/members', [ProjectController::class, 'addMember'])->name('projects.members.store');
    Route::patch('projects/{project}/members/{member}', [ProjectController::class, 'updateMember'])->name('projects.members.update');
    Route::delete('projects/{project}/members/{member}', [ProjectController::class, 'removeMember'])->name('projects.members.destroy');
    Route::post('projects/{project}/comments', [ProjectCommentController::class, 'store'])->name('projects.comments.store');
    Route::delete('projects/{project}/comments/{comment}', [ProjectCommentController::class, 'destroy'])->name('projects.comments.destroy');

    Route::get('admin', [AdminController::class, 'index'])->name('admin.index');
    Route::patch('admin/tasks/{task}', [AdminController::class, 'updateTask'])->name('admin.tasks.update');
    Route::delete('admin/tasks/{task}', [AdminController::class, 'destroyTask'])->name('admin.tasks.destroy');
    Route::patch('admin/tasks/{task}/status', [AdminController::class, 'updateTaskStatus'])->name('admin.tasks.status');
    Route::delete('admin/users/{user}', [AdminController::class, 'destroyUser'])->name('admin.users.destroy');

    Route::patch('notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');
    Route::patch('project-notifications/{notification}/read', [ProjectNotificationController::class, 'markRead'])->name('project-notifications.read');
});

require __DIR__.'/auth.php';
