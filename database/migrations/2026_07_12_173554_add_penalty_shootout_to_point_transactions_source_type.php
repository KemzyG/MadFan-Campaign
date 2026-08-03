<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
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
            'penalty_shootout'
        ) NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
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
            'admin_adjustment'
        ) NOT NULL");
    }
};
