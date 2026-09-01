<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * (club_server_id, slug) is already unique, but that index doesn't stop two
 * fandom channels colliding — NULL club_server_id never equals another NULL
 * in a unique index, so every non-club channel (direct/group/fandom) sits
 * outside it. Fandom channels need their own guard against
 * EnsureFandomChatRoom racing itself into a duplicate #general.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('channels', function (Blueprint $table) {
            $table->unique(['fandom_server_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::table('channels', function (Blueprint $table) {
            $table->dropUnique(['fandom_server_id', 'slug']);
        });
    }
};
