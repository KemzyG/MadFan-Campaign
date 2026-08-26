<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Standing membership in a fandom, separate from `users.favourite_fandom_id`
 * (the one shown on the passport / used for onboarding defaults). Every
 * fandom a fan follows shows up here; a fan can follow more than one once a
 * second fandom exists, even though only one can be "favourite".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fandom_follows', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('fandom_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'fandom_id']);
            $table->index('fandom_id');
        });

        // Backfill: every fan already implicitly follows their favourite fandom.
        $rows = DB::table('users')
            ->whereNotNull('favourite_fandom_id')
            ->get(['id', 'favourite_fandom_id']);

        $now = now();
        $inserts = $rows->map(fn ($row): array => [
            'user_id' => $row->id,
            'fandom_id' => $row->favourite_fandom_id,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        foreach (array_chunk($inserts, 500) as $chunk) {
            DB::table('fandom_follows')->insert($chunk);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('fandom_follows');
    }
};
