<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('voter_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('candidate_user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            // Each user can only cast one vote per task
            $table->unique(['task_id', 'voter_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_votes');
    }
};
