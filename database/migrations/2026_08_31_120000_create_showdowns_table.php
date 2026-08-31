<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A head-to-head fan-vs-fan vote: two users, unlimited taps per voter, the
 * side you pick locks (see showdown_votes). Authored by staff (any two
 * registered users), same shape as Poll (fandom_id/season_id both nullable —
 * a showdown can be fandom-scoped for the hub, or global for the Events
 * feed). votes_a/votes_b are denormalized tallies kept in lockstep with
 * showdown_votes.tap_count by ShowdownService::vote() — reading them beats
 * summing every vote row on every page view.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('showdowns', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('fandom_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('season_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->foreignId('contestant_a_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('contestant_b_user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('votes_a')->default(0);
            $table->unsignedInteger('votes_b')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamp('closes_at')->nullable();
            $table->timestamps();

            $table->index(['fandom_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('showdowns');
    }
};
