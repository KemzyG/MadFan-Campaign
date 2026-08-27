<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('live_stages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('host_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('club_id')->nullable()->constrained('clubs')->nullOnDelete();
            $table->string('type', 32);
            $table->string('title', 120);
            $table->string('description', 500)->nullable();
            $table->string('cover_image_path')->nullable();
            $table->boolean('is_public')->default(true);
            $table->string('status', 16)->default('draft');

            // Media plane — provider-agnostic (see MediaProvider contract). LiveKit
            // is the only implementation today; these columns hold whatever a
            // provider needs to reconnect to/tear down the room, nothing LiveKit-specific.
            $table->string('stream_provider', 32)->default('livekit');
            $table->string('stream_room_id')->nullable();

            // Per-stage-type feature toggles the host chose at creation (comments
            // on/off, reactions on/off, etc.) — kept as JSON rather than dedicated
            // columns since the set differs per LiveStageType and grows over time.
            $table->json('settings')->nullable();

            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'is_public']);
            $table->index(['type', 'status']);
            $table->index('host_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_stages');
    }
};
