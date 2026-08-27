<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Explicit, revocable staff grants (co-host, moderator). The host is NOT a
     * row here — host is `live_stages.host_id`, checked directly, since it's
     * fixed for the stage's lifetime (host transfer isn't in this phase).
     */
    public function up(): void
    {
        Schema::create('live_stage_staff', function (Blueprint $table) {
            $table->id();
            $table->foreignId('live_stage_id')->constrained('live_stages')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role', 16);
            $table->timestamp('granted_at');
            $table->timestamps();

            $table->unique(['live_stage_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_stage_staff');
    }
};
