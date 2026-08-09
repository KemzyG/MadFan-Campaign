<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE point_transactions MODIFY source_type ENUM(
            'task',
            'daily_claim',
            'referral',
            'bonus',
            'club_pick',
            'admin_adjustment',
            'penalty_shootout',
            'social_post',
            'social_reply',
            'social_like_received',
            'social_chat',
            'social_matchday_bonus'
        ) NOT NULL");
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE point_transactions MODIFY source_type ENUM(
            'task',
            'daily_claim',
            'referral',
            'bonus',
            'club_pick',
            'admin_adjustment',
            'penalty_shootout'
        ) NOT NULL");
    }
};
