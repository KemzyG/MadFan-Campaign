<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stage_participants', function (Blueprint $table) {
            // Backstop presence sweep filters active rows by staleness:
            //   where stage_id = ? and left_at is null and last_seen_at < ?
            $table->index(['stage_id', 'left_at', 'last_seen_at'], 'stage_participants_presence_idx');
        });
    }

    public function down(): void
    {
        Schema::table('stage_participants', function (Blueprint $table) {
            $table->dropIndex('stage_participants_presence_idx');
        });
    }
};
