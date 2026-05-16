<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_user', function (Blueprint $table) {
            $table->string('access_level')->default('editor')->after('user_id');
            $table->json('permissions')->nullable()->after('access_level');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::table('project_user', function (Blueprint $table) {
            $table->dropTimestamps();
            $table->dropColumn(['access_level', 'permissions']);
        });
    }
};
