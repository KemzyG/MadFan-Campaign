<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('video_highlights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('club_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('caption', 500)->nullable();
            $table->string('video_url', 2048);
            $table->string('thumbnail_url', 2048)->nullable();
            $table->unsignedSmallInteger('duration_seconds')->nullable();
            $table->unsignedInteger('likes_count')->default(0);
            $table->unsignedInteger('views_count')->default(0);
            $table->boolean('is_featured')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index(['published_at', 'id']);
            $table->index('is_featured');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('video_highlights');
    }
};
