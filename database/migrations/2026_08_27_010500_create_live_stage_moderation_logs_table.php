<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Append-only audit log of moderation actions (see LiveStageModerationAction).
     * Never updated or read back into the live UI — this exists purely so an
     * abuse dispute or a runaway moderator has a trail to review.
     */
    public function up(): void
    {
        Schema::create('live_stage_moderation_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('live_stage_id')->constrained('live_stages')->cascadeOnDelete();
            $table->foreignId('actor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('target_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 32);
            $table->string('reason', 280)->nullable();
            $table->json('context')->nullable();
            $table->timestamp('created_at');

            $table->index(['live_stage_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_stage_moderation_logs');
    }
};
