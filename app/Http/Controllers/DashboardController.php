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
    private function userSummary(?User $user): array
    {
        return [
            'id' => $user?->id,
            'name' => $user?->name ?? 'Unknown',
            'role' => $user?->role ?? 'user',
            'is_admin' => $user?->isAdmin() ?? false,
        ];
    }

    private function fileSummary($file, Task $task, ?TaskSubmission $submission = null, string $kind = 'attachment'): array
    {
        $isSubmissionFile = $kind === 'submission_file' && $submission;
        $previewUrl = null;
        $downloadUrl = null;

        if ($isSubmissionFile) {
            $previewUrl = str_starts_with((string) $file->mime_type, 'image/') || $file->mime_type === 'application/pdf'
                ? route('tasks.submissions.files.preview', [$task->id, $submission->id, $file->id])
                : null;
            $downloadUrl = route('tasks.submissions.files.download', [$task->id, $submission->id, $file->id]);
        } elseif ($kind === 'submission_legacy' && $submission) {
            $previewUrl = str_starts_with((string) $submission->mime_type, 'image/') || $submission->mime_type === 'application/pdf'
                ? route('tasks.submissions.download', [$task->id, $submission->id])
                : null;
            $downloadUrl = route('tasks.submissions.download', [$task->id, $submission->id]);
        } else {
            $previewUrl = str_starts_with((string) $file->mime_type, 'image/') || $file->mime_type === 'application/pdf'
                ? route('tasks.attachments.preview', [$task->id, $file->id])
                : null;
            $downloadUrl = route('tasks.attachments.download', [$task->id, $file->id]);
        }

        return [
            'id' => $file->id ?? $submission?->id,
            'name' => $file->original_name ?? $submission?->original_name ?? 'Uploaded file',
            'mime_type' => $file->mime_type ?? $submission?->mime_type,
            'size' => $file->size ?? $submission?->size ?? 0,
            'created_at' => ($file->created_at ?? $submission?->created_at)?->format('M j, Y g:i A'),
            'preview_url' => $previewUrl,
            'download_url' => $downloadUrl,
        ];
    }

    private function taskReference(?Task $task): ?array
    {
        if (!$task) return null;

        return [
            'type' => 'task',
            'id' => $task->id,
            'label' => $task->title,
            'url' => route('tasks.edit', $task->id),
        ];
    }

    private function projectReference(?Project $project): ?array
    {
        if (!$project) return null;

        return [
            'type' => 'project',
            'id' => $project->id,
            'label' => $project->name,
            'url' => route('projects.show', $project->id),
        ];
    }

    private function taskDetail(?Task $task): ?array
    {
        if (!$task) return null;

        $task->loadMissing(['user', 'project', 'comments.user', 'attachments.user', 'submissions.user', 'submissions.files']);

        return [
            'id' => $task->id,
            'title' => $task->title,
            'description' => $task->description,
            'status' => $task->status,
            'priority' => $task->priority,
            'due_date' => $task->due_date?->format('M j, Y'),
            'due_time' => $task->due_time,
            'assignee' => $this->userSummary($task->user),
            'project' => $task->project ? ['id' => $task->project->id, 'name' => $task->project->name, 'url' => route('projects.show', $task->project->id)] : null,
            'url' => route('tasks.edit', $task->id),
            'comments' => $task->comments->map(fn($comment) => [
                'id' => $comment->id,
                'body' => $comment->body,
                'created_at' => $comment->created_at->format('M j, Y g:i A'),
                'user' => $this->userSummary($comment->user),
            ])->values(),
            'attachments' => $task->attachments->map(fn($attachment) => $this->fileSummary($attachment, $task))->values(),
            'submissions' => $task->submissions->map(function ($submission) use ($task) {
                $files = $submission->files->map(fn($file) => $this->fileSummary($file, $task, $submission, 'submission_file'))->values();
                if ($submission->file_path && $submission->original_name) {
                    $files->prepend($this->fileSummary($submission, $task, $submission, 'submission_legacy'));
                }

                return [
                    'id' => $submission->id,
                    'comment' => $submission->comment,
                    'attempt' => $submission->attempt,
                    'created_at' => $submission->created_at->format('M j, Y g:i A'),
                    'user' => $this->userSummary($submission->user),
                    'files' => $files->values(),
                ];
            })->values(),
        ];
    }

    private function activityEntry(string $id, string $type, string $title, ?User $actor, $occurredAt, array $detail = []): array
    {
        return array_merge([
            'id' => $id,
            'type' => $type,
            'title' => $title,
            'user' => $this->userSummary($actor),
            'user_name' => $actor?->name ?? 'Unknown',
            'meta' => null,
            'occurred_at' => $occurredAt,
            'occurred_at_display' => $occurredAt?->format('M j, Y g:i A'),
            'reference' => null,
            'task' => null,
            'project' => null,
            'submission' => null,
            'files' => [],
            'comments' => [],
        ], $detail);
    }

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
            ? Task::with('project')->whereIn('user_id', $user->workspaceUserIds())->whereNotNull('due_date')
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
            $workspaceUserIds = $user->workspaceUserIds();
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

            $totalUsers     = $user->managedUsers()->count();
            $totalProjects  = Project::whereIn('user_id', $workspaceUserIds)->count();
            $activeProjects = Project::whereIn('user_id', $workspaceUserIds)->whereHas('tasks')->count();
            $totalTasks     = Task::whereIn('user_id', $workspaceUserIds)->count();
            $completedTasks = Task::whereIn('user_id', $workspaceUserIds)->where('status', 'done')->count();
            $pendingTasks   = Task::whereIn('user_id', $workspaceUserIds)->where('status', '!=', 'done')->count();
            $overdueTasks   = Task::where('status', '!=', 'done')
                ->whereIn('user_id', $workspaceUserIds)
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
                        User::where('admin_id', $user->id)->whereBetween('created_at', [$periodStart, now()])->count(),
                        User::where('admin_id', $user->id)->whereBetween('created_at', [$prevStart, $prevEnd])->count()
                    ),
                    'projects'  => $trend(
                        Project::whereIn('user_id', $workspaceUserIds)->whereBetween('created_at', [$periodStart, now()])->count(),
                        Project::whereIn('user_id', $workspaceUserIds)->whereBetween('created_at', [$prevStart, $prevEnd])->count()
                    ),
                    'completed' => $trend(
                        Task::whereIn('user_id', $workspaceUserIds)->where('status', 'done')->whereBetween('updated_at', [$periodStart, now()])->count(),
                        Task::whereIn('user_id', $workspaceUserIds)->where('status', 'done')->whereBetween('updated_at', [$prevStart, $prevEnd])->count()
                    ),
                    'pending'   => $trend(
                        Task::whereIn('user_id', $workspaceUserIds)->where('status', '!=', 'done')->whereBetween('created_at', [$periodStart, now()])->count(),
                        Task::whereIn('user_id', $workspaceUserIds)->where('status', '!=', 'done')->whereBetween('created_at', [$prevStart, $prevEnd])->count()
                    ),
                ],
            ];

            // Activity logs for calendar + feed
            $since = now()->subDays(60)->startOfDay();
            $activityLogs = collect();

            $tasksForLog = Task::with(['user', 'project', 'comments.user', 'attachments.user', 'submissions.user', 'submissions.files'])
                ->whereIn('user_id', $workspaceUserIds)
                ->where(function ($q) use ($since) {
                    $q->where('created_at', '>=', $since)
                        ->orWhere('updated_at', '>=', $since);
                })
                ->get(['id', 'title', 'status', 'created_at', 'updated_at', 'user_id', 'project_id']);

            foreach ($tasksForLog as $task) {
                if ($task->created_at->gte($since)) {
                    $activityLogs->push($this->activityEntry(
                        "task-created-{$task->id}",
                        'task_created',
                        $task->title,
                        $task->user,
                        $task->created_at,
                        [
                            'meta' => $task->project?->name,
                            'reference' => $this->taskReference($task),
                            'task' => $this->taskDetail($task),
                            'project' => $task->project ? ['id' => $task->project->id, 'name' => $task->project->name, 'url' => route('projects.show', $task->project->id)] : null,
                            'comments' => $task->comments->map(fn($comment) => [
                                'id' => $comment->id,
                                'body' => $comment->body,
                                'created_at' => $comment->created_at->format('M j, Y g:i A'),
                                'user' => $this->userSummary($comment->user),
                            ])->values(),
                            'files' => $task->attachments->map(fn($attachment) => $this->fileSummary($attachment, $task))->values(),
                        ]
                    ));
                }

                if ($task->updated_at->gt($task->created_at->addSeconds(5))) {
                    $activityLogs->push($this->activityEntry(
                        "task-updated-{$task->id}",
                        $task->status === 'done' ? 'task_completed' : 'task_updated',
                        $task->title,
                        $task->user,
                        $task->updated_at,
                        [
                            'meta' => $task->project?->name,
                            'reference' => $this->taskReference($task),
                            'task' => $this->taskDetail($task),
                            'project' => $task->project ? ['id' => $task->project->id, 'name' => $task->project->name, 'url' => route('projects.show', $task->project->id)] : null,
                            'comments' => $task->comments->map(fn($comment) => [
                                'id' => $comment->id,
                                'body' => $comment->body,
                                'created_at' => $comment->created_at->format('M j, Y g:i A'),
                                'user' => $this->userSummary($comment->user),
                            ])->values(),
                            'files' => $task->attachments->map(fn($attachment) => $this->fileSummary($attachment, $task))->values(),
                        ]
                    ));
                }
            }

            $submissions = TaskSubmission::with(['user', 'task.user', 'task.project', 'task.comments.user', 'task.attachments.user', 'task.submissions.user', 'task.submissions.files', 'files'])
                ->whereHas('task', fn($q) => $q->whereIn('user_id', $workspaceUserIds))
                ->where('created_at', '>=', $since)
                ->get();
            foreach ($submissions as $submission) {
                $submissionFiles = $submission->files->map(fn($file) => $this->fileSummary($file, $submission->task, $submission, 'submission_file'))->values();
                if ($submission->file_path && $submission->original_name) {
                    $submissionFiles->prepend($this->fileSummary($submission, $submission->task, $submission, 'submission_legacy'));
                }

                $activityLogs->push($this->activityEntry(
                    "submission-{$submission->id}",
                    'submission',
                    $submission->task?->title ?? 'Task submission',
                    $submission->user,
                    $submission->created_at,
                    [
                        'meta' => $submission->comment ? str($submission->comment)->limit(60) : $submission->original_name,
                        'reference' => $this->taskReference($submission->task),
                        'task' => $this->taskDetail($submission->task),
                        'project' => $submission->task?->project ? ['id' => $submission->task->project->id, 'name' => $submission->task->project->name, 'url' => route('projects.show', $submission->task->project->id)] : null,
                        'submission' => [
                            'id' => $submission->id,
                            'comment' => $submission->comment,
                            'attempt' => $submission->attempt,
                            'created_at' => $submission->created_at->format('M j, Y g:i A'),
                            'user' => $this->userSummary($submission->user),
                            'files' => $submissionFiles->values(),
                        ],
                        'files' => $submissionFiles->values(),
                    ]
                ));
            }

            $attachments = TaskAttachment::with(['user', 'task.user', 'task.project', 'task.comments.user', 'task.attachments.user', 'task.submissions.user', 'task.submissions.files'])
                ->whereHas('task', fn($q) => $q->whereIn('user_id', $workspaceUserIds))
                ->where('created_at', '>=', $since)
                ->get();
            foreach ($attachments as $attachment) {
                $file = $this->fileSummary($attachment, $attachment->task);
                $activityLogs->push($this->activityEntry(
                    "attachment-{$attachment->id}",
                    'file_upload',
                    $attachment->task?->title ?? 'Task file upload',
                    $attachment->user,
                    $attachment->created_at,
                    [
                        'meta' => $attachment->original_name,
                        'reference' => $this->taskReference($attachment->task),
                        'task' => $this->taskDetail($attachment->task),
                        'project' => $attachment->task?->project ? ['id' => $attachment->task->project->id, 'name' => $attachment->task->project->name, 'url' => route('projects.show', $attachment->task->project->id)] : null,
                        'files' => [$file],
                    ]
                ));
            }

            $taskComments = Comment::with(['user', 'task.user', 'task.project', 'task.comments.user', 'task.attachments.user', 'task.submissions.user', 'task.submissions.files'])
                ->whereHas('task', fn($q) => $q->whereIn('user_id', $workspaceUserIds))
                ->where('created_at', '>=', $since)
                ->get();
            foreach ($taskComments as $comment) {
                $activityLogs->push($this->activityEntry(
                    "task-comment-{$comment->id}",
                    'task_comment',
                    $comment->task?->title ?? 'Task comment',
                    $comment->user,
                    $comment->created_at,
                    [
                        'meta' => str($comment->body)->limit(48),
                        'reference' => $this->taskReference($comment->task),
                        'task' => $this->taskDetail($comment->task),
                        'project' => $comment->task?->project ? ['id' => $comment->task->project->id, 'name' => $comment->task->project->name, 'url' => route('projects.show', $comment->task->project->id)] : null,
                        'comment' => [
                            'id' => $comment->id,
                            'body' => $comment->body,
                            'created_at' => $comment->created_at->format('M j, Y g:i A'),
                            'user' => $this->userSummary($comment->user),
                        ],
                        'comments' => $comment->task?->comments->map(fn($threadComment) => [
                            'id' => $threadComment->id,
                            'body' => $threadComment->body,
                            'created_at' => $threadComment->created_at->format('M j, Y g:i A'),
                            'user' => $this->userSummary($threadComment->user),
                        ])->values() ?? [],
                    ]
                ));
            }

            $projectComments = ProjectComment::with(['user', 'project'])
                ->whereHas('project', fn($q) => $q->whereIn('user_id', $workspaceUserIds))
                ->where('created_at', '>=', $since)
                ->get();
            foreach ($projectComments as $comment) {
                $project = $comment->project;
                $activityLogs->push($this->activityEntry(
                    "project-comment-{$comment->id}",
                    'project_comment',
                    $project?->name ?? 'Project comment',
                    $comment->user,
                    $comment->created_at,
                    [
                        'meta' => str($comment->body)->limit(48),
                        'reference' => $this->projectReference($project),
                        'project' => $project ? ['id' => $project->id, 'name' => $project->name, 'url' => route('projects.show', $project->id)] : null,
                        'comment' => [
                            'id' => $comment->id,
                            'body' => $comment->body,
                            'created_at' => $comment->created_at->format('M j, Y g:i A'),
                            'user' => $this->userSummary($comment->user),
                        ],
                    ]
                ));
            }

            $projectsForLog = Project::with('user')
                ->whereIn('user_id', $workspaceUserIds)
                ->where('updated_at', '>=', $since)
                ->get(['id', 'name', 'created_at', 'updated_at', 'user_id']);
            foreach ($projectsForLog as $project) {
                if ($project->created_at->gte($since)) {
                    $activityLogs->push($this->activityEntry(
                        "project-created-{$project->id}",
                        'project_created',
                        $project->name,
                        $project->user,
                        $project->created_at,
                        [
                            'reference' => $this->projectReference($project),
                            'project' => ['id' => $project->id, 'name' => $project->name, 'url' => route('projects.show', $project->id)],
                        ]
                    ));
                }

                if ($project->updated_at->gt($project->created_at->addSeconds(5))) {
                    $activityLogs->push($this->activityEntry(
                        "project-updated-{$project->id}",
                        'project_updated',
                        $project->name,
                        $project->user,
                        $project->updated_at,
                        [
                            'reference' => $this->projectReference($project),
                            'project' => ['id' => $project->id, 'name' => $project->name, 'url' => route('projects.show', $project->id)],
                        ]
                    ));
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
                'user'      => $log['user'],
                'meta'      => $log['meta'],
                'occurred_at' => $log['occurred_at']->diffForHumans(),
                'occurred_at_display' => $log['occurred_at_display'],
                'reference' => $log['reference'],
                'task' => $log['task'],
                'project' => $log['project'],
                'submission' => $log['submission'],
                'comment' => $log['comment'] ?? null,
                'files' => $log['files'],
                'comments' => $log['comments'],
            ])->values()->toArray();

            // Per-user task breakdown for the intelligence table
            $userIntelligence = $user->managedUsers()->withCount([
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
                    ? \Carbon\Carbon::parse($u->tasks_max_updated_at)->diffForHumans()
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
                'user'       => $log['user'],
                'meta'       => $log['meta'],
                'occurred_at_display' => $log['occurred_at_display'],
                'reference'  => $log['reference'],
                'task'       => $log['task'],
                'project'    => $log['project'],
                'submission' => $log['submission'],
                'comment'    => $log['comment'] ?? null,
                'files'      => $log['files'],
                'comments'   => $log['comments'],
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
