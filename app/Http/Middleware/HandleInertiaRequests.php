<?php

namespace App\Http\Middleware;

use App\Models\ProjectNotification;
use App\Models\Task;
use App\Models\TaskNotification;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'id'    => $request->user()->id,
                    'name'  => $request->user()->name,
                    'email' => $request->user()->email,
                    'role'  => $request->user()->role,
                ] : null,
            ],
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error'   => fn() => $request->session()->get('error'),
            ],
            'notifications' => function () use ($request) {
                $user = $request->user();
                if (!$user) return [];

                // Seed overdue notifications (tasks past due, not done, not yet notified)
                $overdue = $user->tasks()
                    ->where('status', '!=', 'done')
                    ->whereNotNull('due_date')
                    ->where('due_date', '<', now()->startOfDay())
                    ->whereDoesntHave('notifications', fn($q) => $q->where('type', 'overdue'))
                    ->get();

                foreach ($overdue as $task) {
                    TaskNotification::create([
                        'user_id' => $user->id,
                        'task_id' => $task->id,
                        'type'    => 'overdue',
                    ]);
                }

                // Seed due-soon notifications (tasks due within 2 days, not done, not yet notified)
                $dueSoon = $user->tasks()
                    ->where('status', '!=', 'done')
                    ->whereBetween('due_date', [now()->startOfDay(), now()->addDays(2)->endOfDay()])
                    ->whereDoesntHave('notifications', fn($q) => $q->where('type', 'due_soon'))
                    ->get();

                foreach ($dueSoon as $task) {
                    TaskNotification::create([
                        'user_id' => $user->id,
                        'task_id' => $task->id,
                        'type'    => 'due_soon',
                    ]);
                }

                $taskNotifications = TaskNotification::with('task')
                    ->where('user_id', $user->id)
                    ->latest()
                    ->take(20)
                    ->get()
                    ->map(function ($n) {
                        $dueDate = $n->task?->due_date?->format('M j, Y');
                        $message = match ($n->type) {
                            'reopen_request' => 'Reopen request received',
                            'overdue' => $dueDate ? "Overdue since {$dueDate}" : 'Overdue task',
                            'due_soon' => $dueDate ? "Due {$dueDate}" : 'Due soon',
                            'submission' => 'New submission received',
                            'file_upload' => 'New file uploaded',
                            'assigned' => 'Assigned to you',
                            default => 'Task updated',
                        };

                        return [
                            'kind'       => 'task',
                            'id'         => $n->id,
                            'type'       => $n->type,
                            'read'       => $n->read_at !== null,
                            'created_at' => $n->created_at,
                            'title'      => $n->task?->title ?? 'Task update',
                            'message'    => $message,
                            'url'        => $n->task
                                ? route('tasks.edit', $n->task->id)
                                : route('tasks.index'),
                        ];
                    });

                $projectNotifications = ProjectNotification::with('project')
                    ->where('user_id', $user->id)
                    ->latest()
                    ->take(20)
                    ->get()
                    ->map(function ($n) {
                        $message = match ($n->type) {
                            'project_added' => 'Added to project',
                            'project_updated' => 'Project details updated',
                            default => 'Project update',
                        };

                        return [
                            'kind'       => 'project',
                            'id'         => $n->id,
                            'type'       => $n->type,
                            'read'       => $n->read_at !== null,
                            'created_at' => $n->created_at,
                            'title'      => $n->project?->name ?? 'Project',
                            'message'    => $message,
                            'url'        => $n->project
                                ? route('projects.show', $n->project->id)
                                : route('projects.index'),
                        ];
                    });

                return $taskNotifications
                    ->merge($projectNotifications)
                    ->sortByDesc('created_at')
                    ->take(20)
                    ->values()
                    ->map(fn($n) => [
                        'kind'       => $n['kind'],
                        'id'         => $n['id'],
                        'type'       => $n['type'],
                        'read'       => $n['read'],
                        'created_at' => $n['created_at']->diffForHumans(),
                        'title'      => $n['title'],
                        'message'    => $n['message'],
                        'url'        => $n['url'],
                    ]);
            },
        ];
    }
}
