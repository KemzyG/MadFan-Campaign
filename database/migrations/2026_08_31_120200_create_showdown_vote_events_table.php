<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Append-only tap log powering the "recent activity" feed on the showdown
 * page — one row per tap, not per user, unlike showdown_votes. Unbounded
 * growth is an accepted tradeoff for now: ShowdownService only ever reads
 * the latest handful (`latest()->limit(...)`), so an unindexed backlog
 * doesn't cost a live query anything; revisit with a pruning job only if a
 * showdown's total tap volume ever makes the table itself a problem.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('showdown_vote_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('showdown_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('side', 1);
            $table->timestamp('created_at')->useCurrent();

            $table->index(['showdown_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('showdown_vote_events');
    }
};
