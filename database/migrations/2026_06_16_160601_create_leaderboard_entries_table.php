<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('leaderboard_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('leaderboard_snapshot_id')->constrained('leaderboard_snapshots')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->integer('rank');
            $table->integer('points');
            $table->foreignId('loyalty_tier_id')->nullable()->constrained('loyalty_tiers')->onDelete('set null');
            $table->timestamps();
            $table->unique(['leaderboard_snapshot_id', 'user_id']);
            $table->unique(['leaderboard_snapshot_id', 'rank']);
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leaderboard_entries');
    }
};
