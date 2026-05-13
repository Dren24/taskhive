<?php

namespace App\Console\Commands;

use App\Models\Task;
use Illuminate\Console\Command;

class CloseOverdueTasks extends Command
{
    protected $signature = 'tasks:close-overdue';
    protected $description = 'Automatically close (mark as done) any tasks that are past their due date';

    public function handle(): void
    {
        $count = Task::where('status', '!=', 'done')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', now()->startOfDay())
            ->update(['status' => 'done']);

        $this->info("Closed {$count} overdue task(s).");
    }
}
