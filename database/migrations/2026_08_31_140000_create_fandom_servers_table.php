<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The fandom equivalent of club_servers — a chat home per fandom, since
 * favourite_club_id is no longer set during onboarding and club chat would
 * otherwise be permanently empty for every new fan. See EnsureFandomChatRoom.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fandom_servers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fandom_id')->unique()->constrained('fandoms')->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fandom_servers');
    }
};
