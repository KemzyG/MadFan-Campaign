<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('channel_members', function (Blueprint $table) {
            $table->timestamp('muted_at')->nullable()->after('last_read_at');
            $table->timestamp('archived_at')->nullable()->after('muted_at');
            $table->unsignedInteger('disappearing_seconds')->nullable()->after('archived_at');
            $table->timestamp('cleared_before_at')->nullable()->after('disappearing_seconds');
        });
    }

    public function down(): void
    {
        Schema::table('channel_members', function (Blueprint $table) {
            $table->dropColumn([
                'muted_at',
                'archived_at',
                'disappearing_seconds',
                'cleared_before_at',
            ]);
        });
    }
};
