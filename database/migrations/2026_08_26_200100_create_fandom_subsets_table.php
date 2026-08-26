<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The "subset" under a Fandom category — leagues for Football, games for
 * Esports, genres for Music, and so on. Deliberately generic (no per-domain
 * columns like standings) so every category browses the same way; Football's
 * real League/Club/standings machinery is untouched and unrelated to this.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fandom_subsets', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('fandom_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('image')->nullable();
            $table->unsignedInteger('fan_count')->default(0);
            $table->boolean('is_trending')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['fandom_id', 'sort_order']);
            $table->index('is_trending');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fandom_subsets');
    }
};
