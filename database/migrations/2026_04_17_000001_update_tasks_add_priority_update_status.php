<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Migrate existing status values to new values before changing the column
        DB::table('tasks')->where('status', 'pending')->update(['status' => 'todo']);
        DB::table('tasks')->where('status', 'completed')->update(['status' => 'done']);

        Schema::table('tasks', function (Blueprint $table) {
            // Add priority column
            $table->string('priority')->default('medium')->after('description');

            // Change status to string (enum->change() is broken on PostgreSQL)
            // We'll add a CHECK constraint separately below
            $table->string('status')->default('todo')->change();
        });

        // SQLite does not support adding named CHECK constraints to an
        // existing table; the app-level validation still covers test runs.
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check CHECK (priority IN ('low', 'medium', 'high'))");
            DB::statement("ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check");
            DB::statement("ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('todo', 'in_progress', 'done'))");
        }
    }

    public function down(): void
    {
        DB::table('tasks')->where('status', 'todo')->update(['status' => 'pending']);
        DB::table('tasks')->where('status', 'in_progress')->update(['status' => 'pending']);
        DB::table('tasks')->where('status', 'done')->update(['status' => 'completed']);

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_priority_check");
            DB::statement("ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check");
        }

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('priority');
            $table->string('status')->default('pending')->change();
        });

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('pending', 'completed'))");
        }
    }
};
