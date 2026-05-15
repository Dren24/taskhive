<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        /** @var User $user */
        $user  = Auth::user();
        $tasks = $user->tasks()->latest()->take(10)->get();

        $today = now()->startOfDay();

        $stats = [
            'total'       => $user->tasks()->count(),
            'todo'        => $user->tasks()->where('status', 'todo')->count(),
            'in_progress' => $user->tasks()->where('status', 'in_progress')->count(),
            'done'        => $user->tasks()->where('status', 'done')->count(),
        ];

        // Flat array of tasks with due dates for the calendar widget
        $calendarTasks = $user->tasks()
            ->whereNotNull('due_date')
            ->get(['id', 'title', 'description', 'due_date', 'status', 'priority'])
            ->map(fn($t) => [
                'id'         => $t->id,
                'title'      => $t->title,
                'description'=> $t->description,
                'status'     => $t->status,
                'priority'   => $t->priority,
                'due_date'   => $t->due_date->format('Y-m-d'),
                'is_overdue' => $t->status !== 'done' && $t->due_date->lt($today),
            ])
            ->values()
            ->toArray();

        return Inertia::render('Dashboard', [
            'tasks'         => $tasks->map(fn($t) => [
                'id'        => $t->id,
                'title'     => $t->title,
                'status'    => $t->status,
                'priority'  => $t->priority,
                'due_date'  => $t->due_date?->format('Y-m-d'),
                'is_overdue'=> $t->status !== 'done' && $t->due_date && $t->due_date->lt($today),
            ]),
            'stats'         => $stats,
            'calendarTasks' => $calendarTasks,
        ]);
    }
}
