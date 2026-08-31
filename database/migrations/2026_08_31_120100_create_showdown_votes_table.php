<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One row per (showdown, user) — `side` is set on the first tap and never
 * changes after (ShowdownService::vote() rejects a tap for the other side),
 * `tap_count` is that user's running vote total for this showdown, and
 * `points_awarded` tracks how many of those taps already earned points so
 * the daily cap (see AwardSocialPoints::SOURCE_SHOWDOWN_VOTE) is resumable
 * across requests instead of re-derived.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('showdown_votes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('showdown_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('side', 1);
            $table->unsignedInteger('tap_count')->default(0);
            $table->unsignedInteger('points_awarded')->default(0);
            $table->timestamps();

            $table->unique(['showdown_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('showdown_votes');
    }
};
