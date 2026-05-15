<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Project;
use App\Models\ProjectComment;
use App\Models\Task;
use App\Models\TaskAttachment;
use App\Models\TaskNotification;
use App\Models\TaskSubmission;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function index()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        abort_if(!$user->isAdmin(), 403);

        $users = User::where('role', '!=', 'admin')
            ->withCount([
                'tasks',
                'projects',
                'memberProjects',
            ])
            ->withMax('tasks', 'updated_at')
            ->with([
                'projects:id,name,user_id',
                'memberProjects:id,name',
            ])
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

        $auditLogs = AuditLog::with('actor')
            ->latest()
            ->take(8)
            ->get();

        return Inertia::render('Admin/Index', [
            'users' => $users->map(fn($u) => [
                'id'            => $u->id,
                'name'          => $u->name,
                'email'         => $u->email,
                'role'          => $u->role,
                'tasks_count'   => $u->tasks_count,
                'projects_count'=> ($u->projects_count ?? 0) + ($u->member_projects_count ?? 0),
                'last_active'   => $u->tasks_max_updated_at
                    ? \Carbon\Carbon::parse($u->tasks_max_updated_at)->diffForHumans()
                    : 'No activity',
                'projects'      => $u->projects
                    ->concat($u->memberProjects)
                    ->unique('id')
                    ->values()
                    ->map(fn($p) => ['id' => $p->id, 'name' => $p->name]),
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
            'auditLogs' => $auditLogs->map(fn($log) => [
                'id'          => $log->id,
                'action'      => $log->action,
                'actor'       => $log->actor?->name ?? 'System',
                'target_name' => $log->target_name ?? 'Unknown',
                'target_email'=> $log->target_email,
                'created_at'  => $log->created_at->diffForHumans(),
            ]),
        ]);
    }

    public function destroyUser(User $user)
    {
        /** @var \App\Models\User $admin */
        $admin = Auth::user();
        abort_if(!$admin->isAdmin(), 403);
        abort_if($user->id === $admin->id, 422, 'You cannot delete your own account.');
        abort_if($user->isAdmin(), 422, 'Admin accounts cannot be deleted.');

        $metadata = [
            'tasks' => Task::where('user_id', $user->id)->count(),
            'task_comments' => \App\Models\Comment::where('user_id', $user->id)->count(),
            'project_comments' => ProjectComment::where('user_id', $user->id)->count(),
            'attachments' => TaskAttachment::where('user_id', $user->id)->count(),
            'submissions' => TaskSubmission::where('user_id', $user->id)->count(),
            'task_notifications' => TaskNotification::where('user_id', $user->id)->count(),
            'owned_projects' => Project::where('user_id', $user->id)->count(),
            'project_memberships' => DB::table('project_user')->where('user_id', $user->id)->count(),
        ];

        DB::transaction(function () use ($admin, $user, $metadata) {
            AuditLog::create([
                'actor_id'      => $admin->id,
                'action'        => 'user_deleted',
                'target_user_id'=> $user->id,
                'target_name'   => $user->name,
                'target_email'  => $user->email,
                'metadata'      => $metadata,
                'ip_address'    => request()->ip(),
                'user_agent'    => request()->userAgent(),
            ]);

            $user->delete();
        });

        return back()->with('success', 'User account permanently deleted.');
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
