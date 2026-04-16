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
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium')->after('description');
            $table->enum('status', ['todo', 'in_progress', 'done'])->default('todo')->change();
        });
    }

    public function down(): void
    {
        DB::table('tasks')->where('status', 'todo')->update(['status' => 'pending']);
        DB::table('tasks')->where('status', 'in_progress')->update(['status' => 'pending']);
        DB::table('tasks')->where('status', 'done')->update(['status' => 'completed']);

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('priority');
            $table->enum('status', ['pending', 'completed'])->default('pending')->change();
        });
    }
};
