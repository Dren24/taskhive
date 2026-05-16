<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('admin_id')
                ->nullable()
                ->after('role')
                ->constrained('users')
                ->nullOnDelete();
            $table->string('admin_invitation_code', 24)
                ->nullable()
                ->unique()
                ->after('admin_id');
            $table->timestamp('admin_invitation_code_expires_at')
                ->nullable()
                ->after('admin_invitation_code');
        });

        DB::table('users')
            ->where('role', 'admin')
            ->whereNull('admin_invitation_code')
            ->orderBy('id')
            ->get(['id'])
            ->each(function ($admin) {
                do {
                    $code = 'ADM-' . Str::upper(Str::random(4)) . '-' . Str::upper(Str::random(4));
                } while (DB::table('users')->where('admin_invitation_code', $code)->exists());

                DB::table('users')
                    ->where('id', $admin->id)
                    ->update(['admin_invitation_code' => $code]);
            });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['admin_id']);
            $table->dropUnique(['admin_invitation_code']);
            $table->dropColumn([
                'admin_id',
                'admin_invitation_code',
                'admin_invitation_code_expires_at',
            ]);
        });
    }
};
