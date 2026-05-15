<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Project;
use App\Models\ProjectComment;
use App\Models\Task;
use App\Models\TaskAttachment;
use App\Models\TaskSubmission;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        /** @var User $user */
        $user    = Auth::user();
        $today   = now()->startOfDay();
        $isAdmin = $user->isAdmin();

        // ── Per-user task data (used for both regular users and admin's own stats) ──
        $tasks = $user->tasks()->latest()->take(10)->get();

        $stats = [
            'total'       => $user->tasks()->count(),
            'todo'        => $user->tasks()->where('status', 'todo')->count(),
            'in_progress' => $user->tasks()->where('status', 'in_progress')->count(),
            'done'        => $user->tasks()->where('status', 'done')->count(),
        ];

        // Calendar tasks: admin sees all system tasks, regular user sees only their own
        $calendarBase = $isAdmin
            ? Task::with('project')->whereNotNull('due_date')
            : $user->tasks()->with('project')->whereNotNull('due_date');

        $calendarTasks = $calendarBase
            ->get(['id', 'title', 'description', 'due_date', 'due_time', 'status', 'priority', 'project_id'])
            ->map(fn($t) => [
                'id'           => $t->id,
                'title'        => $t->title,
                'description'  => $t->description,
                'status'       => $t->status,
                'priority'     => $t->priority,
                'due_date'     => $t->due_date->format('Y-m-d'),
                'due_time'     => $t->due_time,
                'is_overdue'   => $t->status !== 'done' && $t->due_date->lt($today),
                'project_name' => $t->project?->name,
            ])
            ->values()
            ->toArray();

        // ── Admin-only intelligence data ──────────────────────────────────────────
        $adminStats       = null;
        $activityFeed     = null;
        $userIntelligence = null;
        $activityLogs     = null;

        if ($isAdmin) {
            $periodStart = now()->subDays(7)->startOfDay();
            $prevStart   = now()->subDays(14)->startOfDay();
            $prevEnd     = now()->subDays(7)->endOfDay();

            $trend = function (int $current, int $previous) {
                if ($previous === 0) {
                    return ['direction' => $current > 0 ? 'up' : 'flat', 'value' => $current > 0 ? 100 : 0];
                }
                $delta = $current - $previous;
                $pct = (int) round(($delta / $previous) * 100);
                return ['direction' => $pct >= 0 ? 'up' : 'down', 'value' => abs($pct)];
            };

            $totalUsers     = User::count();
            $totalProjects  = Project::count();
            $activeProjects = Project::whereHas('tasks')->count();
            $totalTasks     = Task::count();
            $completedTasks = Task::where('status', 'done')->count();
            $pendingTasks   = Task::where('status', '!=', 'done')->count();
            $overdueTasks   = Task::where('status', '!=', 'done')
                ->whereNotNull('due_date')
                ->whereDate('due_date', '<', today())
                ->count();

            $adminStats = [
                'total_users'     => $totalUsers,
                'total_projects'  => $totalProjects,
                'active_projects' => $activeProjects,
                'tasks_today'     => Task::whereDate('created_at', today())->count(),
                'total_tasks'     => $totalTasks,
                'completed_tasks' => $completedTasks,
                'pending_tasks'   => $pendingTasks,
                'overdue_tasks'   => $overdueTasks,
                'trends' => [
                    'users'     => $trend(
                        User::whereBetween('created_at', [$periodStart, now()])->count(),
                        User::whereBetween('created_at', [$prevStart, $prevEnd])->count()
                    ),
                    'projects'  => $trend(
                        Project::whereBetween('created_at', [$periodStart, now()])->count(),
                        Project::whereBetween('created_at', [$prevStart, $prevEnd])->count()
                    ),
                    'completed' => $trend(
                        Task::where('status', 'done')->whereBetween('updated_at', [$periodStart, now()])->count(),
                        Task::where('status', 'done')->whereBetween('updated_at', [$prevStart, $prevEnd])->count()
                    ),
                    'pending'   => $trend(
                        Task::where('status', '!=', 'done')->whereBetween('created_at', [$periodStart, now()])->count(),
                        Task::where('status', '!=', 'done')->whereBetween('created_at', [$prevStart, $prevEnd])->count()
                    ),
                ],
            ];

            // Activity logs for calendar + feed
            $since = now()->subDays(60)->startOfDay();
            $activityLogs = collect();

            $tasksForLog = Task::with(['user', 'project'])
                ->where(function ($q) use ($since) {
                    $q->where('created_at', '>=', $since)
                        ->orWhere('updated_at', '>=', $since);
                })
                ->get(['id', 'title', 'status', 'created_at', 'updated_at', 'user_id', 'project_id']);

            foreach ($tasksForLog as $task) {
                if ($task->created_at->gte($since)) {
                    $activityLogs->push([
                        'id' => "task-created-{$task->id}",
                        'type' => 'task_created',
                        'title' => $task->title,
                        'user_name' => $task->user?->name ?? 'Unknown',
                        'meta' => $task->project?->name,
                        'occurred_at' => $task->created_at,
                    ]);
                }

                if ($task->updated_at->gt($task->created_at->addSeconds(5))) {
                    $activityLogs->push([
                        'id' => "task-updated-{$task->id}",
                        'type' => $task->status === 'done' ? 'task_completed' : 'task_updated',
                        'title' => $task->title,
                        'user_name' => $task->user?->name ?? 'Unknown',
                        'meta' => $task->project?->name,
                        'occurred_at' => $task->updated_at,
                    ]);
                }
            }

            $submissions = TaskSubmission::with(['user', 'task'])
                ->where('created_at', '>=', $since)
                ->get();
            foreach ($submissions as $submission) {
                $activityLogs->push([
                    'id' => "submission-{$submission->id}",
                    'type' => 'submission',
                    'title' => $submission->task?->title ?? 'Task submission',
                    'user_name' => $submission->user?->name ?? 'Unknown',
                    'meta' => $submission->original_name,
                    'occurred_at' => $submission->created_at,
                ]);
            }

            $attachments = TaskAttachment::with(['user', 'task'])
                ->where('created_at', '>=', $since)
                ->get();
            foreach ($attachments as $attachment) {
                $activityLogs->push([
                    'id' => "attachment-{$attachment->id}",
                    'type' => 'file_upload',
                    'title' => $attachment->task?->title ?? 'Task file upload',
                    'user_name' => $attachment->user?->name ?? 'Unknown',
                    'meta' => $attachment->original_name,
                    'occurred_at' => $attachment->created_at,
                ]);
            }

            $taskComments = Comment::with(['user', 'task'])
                ->where('created_at', '>=', $since)
                ->get();
            foreach ($taskComments as $comment) {
                $activityLogs->push([
                    'id' => "task-comment-{$comment->id}",
                    'type' => 'task_comment',
                    'title' => $comment->task?->title ?? 'Task comment',
                    'user_name' => $comment->user?->name ?? 'Unknown',
                    'meta' => str($comment->body)->limit(48),
                    'occurred_at' => $comment->created_at,
                ]);
            }

            $projectComments = ProjectComment::with(['user', 'project'])
                ->where('created_at', '>=', $since)
                ->get();
            foreach ($projectComments as $comment) {
                $activityLogs->push([
                    'id' => "project-comment-{$comment->id}",
                    'type' => 'project_comment',
                    'title' => $comment->project?->name ?? 'Project comment',
                    'user_name' => $comment->user?->name ?? 'Unknown',
                    'meta' => str($comment->body)->limit(48),
                    'occurred_at' => $comment->created_at,
                ]);
            }

            $projectsForLog = Project::with('user')
                ->where('updated_at', '>=', $since)
                ->get(['id', 'name', 'created_at', 'updated_at', 'user_id']);
            foreach ($projectsForLog as $project) {
                if ($project->created_at->gte($since)) {
                    $activityLogs->push([
                        'id' => "project-created-{$project->id}",
                        'type' => 'project_created',
                        'title' => $project->name,
                        'user_name' => $project->user?->name ?? 'Unknown',
                        'meta' => null,
                        'occurred_at' => $project->created_at,
                    ]);
                }

                if ($project->updated_at->gt($project->created_at->addSeconds(5))) {
                    $activityLogs->push([
                        'id' => "project-updated-{$project->id}",
                        'type' => 'project_updated',
                        'title' => $project->name,
                        'user_name' => $project->user?->name ?? 'Unknown',
                        'meta' => null,
                        'occurred_at' => $project->updated_at,
                    ]);
                }
            }

            $activityLogs = $activityLogs
                ->sortByDesc('occurred_at')
                ->values();

            $activityFeed = $activityLogs->take(12)->map(fn($log) => [
                'id'        => $log['id'],
                'title'     => $log['title'],
                'type'      => $log['type'],
                'user_name' => $log['user_name'],
                'meta'      => $log['meta'],
                'occurred_at' => $log['occurred_at']->diffForHumans(),
            ])->values()->toArray();

            // Per-user task breakdown for the intelligence table
            $userIntelligence = User::withCount([
                'tasks as total_tasks',
                'tasks as completed_tasks' => fn($q) => $q->where('status', 'done'),
                'tasks as pending_tasks'   => fn($q) => $q->where('status', '!=', 'done'),
            ])
            ->withMax('tasks', 'updated_at')
            ->with([
                'projects:id,name,user_id',
                'memberProjects:id,name',
                'tasks' => fn($q) => $q->latest()->take(3),
            ])
            ->orderByDesc('total_tasks')
            ->get()
            ->map(fn($u) => [
                'id'          => $u->id,
                'name'        => $u->name,
                'email'       => $u->email,
                'role'        => $u->role,
                'total'       => $u->total_tasks,
                'done'        => $u->completed_tasks,
                'pending'     => $u->pending_tasks,
                'projects'    => $u->projects
                    ->concat($u->memberProjects)
                    ->unique('id')
                    ->values()
                    ->map(fn($p) => ['id' => $p->id, 'name' => $p->name]),
                'recent_tasks' => $u->tasks->map(fn($t) => [
                    'id'     => $t->id,
                    'title'  => $t->title,
                    'status' => $t->status,
                ]),
                'last_active' => $u->tasks_max_updated_at
                    ? $u->tasks_max_updated_at->diffForHumans()
                    : 'No activity',
            ])
            ->values()
            ->toArray();

            $activityLogs = $activityLogs->take(200)->map(fn($log) => [
                'id'         => $log['id'],
                'date'       => $log['occurred_at']->format('Y-m-d'),
                'time'       => $log['occurred_at']->format('H:i'),
                'type'       => $log['type'],
                'title'      => $log['title'],
                'user_name'  => $log['user_name'],
                'meta'       => $log['meta'],
            ])->values()->toArray();
        }

        return Inertia::render('Dashboard', [
            'tasks'            => $tasks->map(fn($t) => [
                'id'         => $t->id,
                'title'      => $t->title,
                'status'     => $t->status,
                'priority'   => $t->priority,
                'due_date'   => $t->due_date?->format('Y-m-d'),
                'due_time'   => $t->due_time,
                'is_overdue' => $t->status !== 'done' && $t->due_date && $t->due_date->lt($today),
            ]),
            'stats'            => $stats,
            'calendarTasks'    => $calendarTasks,
            'isAdmin'          => $isAdmin,
            'adminStats'       => $adminStats,
            'activityFeed'     => $activityFeed,
            'userIntelligence' => $userIntelligence,
            'activityLogs'     => $activityLogs,
        ]);
    }
}
