<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Editorial events for the Social "what's happening NOW" feed.
 *
 * Seven of the ten event kinds are projections over existing models. The three
 * that have no natural source — concert, song release, breaking news — are
 * authored here. Kind-specific fields (artist, venue, track, source, …) live in
 * `meta` rather than sprawling nullable columns, since each kind uses a
 * different handful and only its own template reads them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('social_announcements', function (Blueprint $table) {
            $table->id();
            $table->string('type', 24);
            $table->foreignId('club_id')->nullable()->constrained('clubs')->nullOnDelete();
            $table->string('headline');
            $table->string('subtitle')->nullable();
            $table->string('image_path')->nullable();
            $table->string('link_url')->nullable();
            $table->string('link_label', 40)->nullable();
            $table->json('meta')->nullable();
            $table->boolean('is_pinned')->default(false);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index(['type', 'published_at']);
            $table->index('published_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_announcements');
    }
};
