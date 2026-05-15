<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
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

        if ($isAdmin) {
            $adminStats = [
                'total_users'     => User::count(),
                'total_projects'  => Project::count(),
                'tasks_today'     => Task::whereDate('created_at', today())->count(),
                'total_tasks'     => Task::count(),
                'completed_tasks' => Task::where('status', 'done')->count(),
                'overdue_tasks'   => Task::where('status', '!=', 'done')
                                         ->whereNotNull('due_date')
                                         ->whereDate('due_date', '<', today())
                                         ->count(),
            ];

            // Recent system activity — 12 most recently touched tasks
            $activityFeed = Task::with('user')
                ->latest('updated_at')
                ->take(12)
                ->get()
                ->map(fn($t) => [
                    'id'        => $t->id,
                    'title'     => $t->title,
                    'status'    => $t->status,
                    'user_name' => $t->user?->name ?? 'Unknown',
                    'updated_at'=> $t->updated_at->diffForHumans(),
                    // Detect action type: new vs completed vs general update
                    'type'      => $t->updated_at->diffInSeconds($t->created_at) < 10
                                    ? 'created'
                                    : ($t->status === 'done' ? 'completed' : 'updated'),
                ])
                ->values()
                ->toArray();

            // Per-user task breakdown for the intelligence table
            $userIntelligence = User::withCount([
                'tasks as total_tasks',
                'tasks as completed_tasks' => fn($q) => $q->where('status', 'done'),
                'tasks as pending_tasks'   => fn($q) => $q->where('status', '!=', 'done'),
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
                'last_active' => optional(
                    $u->tasks()->latest('updated_at')->first()?->updated_at
                )->diffForHumans() ?? 'No activity',
            ])
            ->values()
            ->toArray();
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
        ]);
    }
}
