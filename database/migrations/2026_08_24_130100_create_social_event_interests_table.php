<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "I'm interested" marks on events-feed cards.
 *
 * Events come from seven different models plus the announcements table, so
 * there is no single foreign key to hang this off. Rows are keyed by the
 * event's stable string key (`live_match:12`, `concert:3`, …) which the event
 * providers mint — the same key the client sends back on toggle.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('social_event_interests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('event_key', 96);
            $table->string('event_type', 24);
            $table->timestamps();

            $table->unique(['user_id', 'event_key']);
            $table->index('event_key');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_event_interests');
    }
};
