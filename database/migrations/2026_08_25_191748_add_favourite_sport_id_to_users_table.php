<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('favourite_sport_id')
                ->nullable()
                ->after('favourite_club_id')
                ->constrained('sports')
                ->nullOnDelete();
        });

        // Every existing onboarded fan already implicitly follows football —
        // backfill so EnsureSocialOnboarded doesn't bounce them back through
        // a new sport-selection step they've effectively already completed.
        $footballId = DB::table('sports')->where('slug', 'football')->value('id');

        if ($footballId !== null) {
            DB::table('users')
                ->whereNotNull('favourite_club_id')
                ->update(['favourite_sport_id' => $footballId]);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('favourite_sport_id');
        });
    }
};
