<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('club_id')->nullable()->constrained('clubs')->nullOnDelete();
            $table->string('type', 16)->default('status');
            $table->text('body')->nullable();
            $table->foreignId('reply_to_id')->nullable()->constrained('posts')->cascadeOnDelete();
            $table->foreignId('root_id')->nullable()->constrained('posts')->cascadeOnDelete();
            $table->foreignId('quote_of_id')->nullable()->constrained('posts')->nullOnDelete();
            $table->foreignId('repost_of_id')->nullable()->constrained('posts')->nullOnDelete();
            $table->unsignedInteger('likes_count')->default(0);
            $table->unsignedInteger('replies_count')->default(0);
            $table->unsignedInteger('reposts_count')->default(0);
            $table->unsignedInteger('quotes_count')->default(0);
            $table->string('lang', 8)->nullable();
            $table->boolean('is_hidden')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['author_id', 'id']);
            $table->index(['club_id', 'id']);
            $table->index(['root_id', 'id']);
            $table->index(['reply_to_id', 'id']);
            $table->index(['published_at', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
