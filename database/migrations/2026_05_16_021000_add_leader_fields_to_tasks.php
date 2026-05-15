<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->uuid('group_id')->nullable()->after('id')->index();
            $table->string('submission_mode')->default('manual')->after('max_submissions'); // manual | voting
            $table->foreignId('leader_user_id')->nullable()->constrained('users')->nullOnDelete()->after('submission_mode');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['leader_user_id']);
            $table->dropColumn(['group_id', 'submission_mode', 'leader_user_id']);
        });
    }
};
