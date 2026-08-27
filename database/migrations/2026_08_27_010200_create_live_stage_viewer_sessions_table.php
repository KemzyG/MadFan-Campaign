<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Presence, not analytics. One active row (`left_at` null) per user per
     * stage — viewer count is `COUNT(*) WHERE left_at IS NULL AND stage_id = ?`,
     * kept honest by a heartbeat + stale-sweep on read (mirrors the existing
     * Stage voice-room presence pattern in StageService::pruneStaleParticipants,
     * proven at this app's scale — no separate Redis presence layer needed yet).
     */
    public function up(): void
    {
        Schema::create('live_stage_viewer_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('live_stage_id')->constrained('live_stages')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('joined_at');
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamp('left_at')->nullable();
            $table->timestamp('banned_at')->nullable();
            $table->boolean('is_muted_by_host')->default(false);
            $table->timestamps();

            $table->index(['live_stage_id', 'left_at']);
            $table->index(['live_stage_id', 'user_id', 'left_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_stage_viewer_sessions');
    }
};
