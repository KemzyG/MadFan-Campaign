<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A post's community scope is moving from club to fandom (see
 * PostVisibility::Fandom) — club_id/PostVisibility::Club stay exactly as
 * they are for existing posts, this is additive. New top-level posts stamp
 * both (see CreateSocialPost) since favourite_club_id is no longer set
 * during onboarding and will often be null going forward.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table): void {
            $table->foreignId('fandom_id')->nullable()->after('club_id')->constrained()->nullOnDelete();
            $table->index(['fandom_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('fandom_id');
        });
    }
};
