<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Polls are editorial content (someone has to write the question and
 * options), unlike Predictions which derive from fixtures automatically —
 * authored via the admin PollResource.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('polls', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('fandom_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('season_id')->nullable()->constrained()->nullOnDelete();
            $table->string('question');
            $table->boolean('is_active')->default(true);
            $table->timestamp('closes_at')->nullable();
            $table->timestamps();

            $table->index(['fandom_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('polls');
    }
};
