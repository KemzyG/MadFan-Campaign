<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Columns the Fandom discovery/browse page needs: `group` powers the top
 * pill filter (All / Sports / Esports / Music / Books), `icon` is the small
 * emoji badge on every card, `cover_image` is optional — cards fall back to
 * an icon-tinted background rather than a stock photo when it's null (see
 * FandomHubService::header for the same no-photo-required convention).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fandoms', function (Blueprint $table): void {
            $table->string('group')->nullable()->after('slug');
            $table->string('icon')->nullable()->after('group');
            $table->string('cover_image')->nullable()->after('icon');
        });

        DB::table('fandoms')->where('slug', 'football')->update([
            'group' => 'sports',
            'icon' => '⚽',
        ]);
    }

    public function down(): void
    {
        Schema::table('fandoms', function (Blueprint $table): void {
            $table->dropColumn(['group', 'icon', 'cover_image']);
        });
    }
};
