<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One prediction per fixture — "who wins?" with a fixed Home/Draw/Away
 * outcome space, auto-created for upcoming fixtures (see
 * App\Services\Social\PredictionService) rather than hand-authored, since
 * the outcome and closing time both derive directly from the fixture.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('predictions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('match_fixture_id')->constrained()->cascadeOnDelete();
            $table->foreignId('fandom_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('season_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedSmallInteger('points_reward')->default(15);
            $table->timestamp('closes_at');
            $table->string('correct_choice', 8)->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->unique('match_fixture_id');
            $table->index(['fandom_id', 'closes_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('predictions');
    }
};
