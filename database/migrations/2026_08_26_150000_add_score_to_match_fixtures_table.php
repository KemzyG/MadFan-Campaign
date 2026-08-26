<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Match fixtures previously had no result data at all — status could reach
 * "finished" with no score ever recorded. Predictions need a real result to
 * resolve against, so this adds it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('match_fixtures', function (Blueprint $table): void {
            $table->unsignedTinyInteger('home_score')->nullable()->after('status');
            $table->unsignedTinyInteger('away_score')->nullable()->after('home_score');
        });
    }

    public function down(): void
    {
        Schema::table('match_fixtures', function (Blueprint $table): void {
            $table->dropColumn(['home_score', 'away_score']);
        });
    }
};
