<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        /** @var User $user */
        $user  = Auth::user();
        $tasks = $user->tasks()->latest()->take(10)->get();

        $stats = [
            'todo'        => $user->tasks()->where('status', 'todo')->count(),
            'in_progress' => $user->tasks()->where('status', 'in_progress')->count(),
            'done'        => $user->tasks()->where('status', 'done')->count(),
        ];

        $taskDates = $user->tasks()
            ->whereNotNull('due_date')
            ->pluck('due_date')
            ->map(fn($d) => $d->format('Y-m-d'))
            ->unique()
            ->values();

        return view('dashboard', compact('tasks', 'stats', 'taskDates'));
    }
}
