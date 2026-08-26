<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Renames the "Sport" taxonomy concept to "Fandom" end to end: the `sports`
 * table, and the two foreign keys that point at it. Uses new migrations
 * rather than editing the original create/add migrations because those have
 * already run in deployed environments (main branch) — rewriting migration
 * history in place would silently no-op there.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('sports', 'fandoms');

        Schema::table('leagues', function (Blueprint $table): void {
            $table->dropForeign(['sport_id']);
        });
        Schema::table('leagues', function (Blueprint $table): void {
            $table->renameColumn('sport_id', 'fandom_id');
        });
        Schema::table('leagues', function (Blueprint $table): void {
            $table->foreign('fandom_id')->references('id')->on('fandoms')->nullOnDelete();
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropForeign(['favourite_sport_id']);
        });
        Schema::table('users', function (Blueprint $table): void {
            $table->renameColumn('favourite_sport_id', 'favourite_fandom_id');
        });
        Schema::table('users', function (Blueprint $table): void {
            $table->foreign('favourite_fandom_id')->references('id')->on('fandoms')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropForeign(['favourite_fandom_id']);
        });
        Schema::table('users', function (Blueprint $table): void {
            $table->renameColumn('favourite_fandom_id', 'favourite_sport_id');
        });

        Schema::table('leagues', function (Blueprint $table): void {
            $table->dropForeign(['fandom_id']);
        });
        Schema::table('leagues', function (Blueprint $table): void {
            $table->renameColumn('fandom_id', 'sport_id');
        });

        Schema::rename('fandoms', 'sports');

        Schema::table('leagues', function (Blueprint $table): void {
            $table->foreign('sport_id')->references('id')->on('sports')->nullOnDelete();
        });
        Schema::table('users', function (Blueprint $table): void {
            $table->foreign('favourite_sport_id')->references('id')->on('sports')->nullOnDelete();
        });
    }
};
