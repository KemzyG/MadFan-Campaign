<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Reactions are high-frequency and ephemeral (broadcast for the floating
     * animation, never persisted per-event — see LiveStageReactionCreated).
     * This table holds only the aggregate: one row per (stage, emoji), bumped
     * with a single atomic UPDATE per reaction instead of an INSERT. A stage
     * with 10k reactions costs 6 rows here (one per emoji), not 10k.
     */
    public function up(): void
    {
        Schema::create('live_stage_reaction_totals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('live_stage_id')->constrained('live_stages')->cascadeOnDelete();
            $table->string('emoji', 8);
            $table->unsignedBigInteger('total')->default(0);
            $table->timestamps();

            $table->unique(['live_stage_id', 'emoji']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_stage_reaction_totals');
    }
};
