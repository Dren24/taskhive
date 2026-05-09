<?php

namespace App\Http\Middleware;

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

                return TaskNotification::with('task')
                    ->where('user_id', $user->id)
                    ->latest()
                    ->take(20)
                    ->get()
                    ->map(fn($n) => [
                        'id'      => $n->id,
                        'type'    => $n->type,
                        'read'    => $n->read_at !== null,
                        'created_at' => $n->created_at->diffForHumans(),
                        'task'    => [
                            'id'       => $n->task->id,
                            'title'    => $n->task->title,
                            'due_date' => $n->task->due_date?->format('M j, Y'),
                        ],
                    ]);
            },
        ];
    }
}

