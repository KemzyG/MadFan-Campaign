<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stage_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stage_id')->constrained('stages')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role', 16)->default('listener');
            $table->boolean('is_muted')->default(true);
            $table->timestamp('speak_requested_at')->nullable();
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('left_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();

            $table->unique(['stage_id', 'user_id']);
            $table->index(['stage_id', 'role', 'left_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stage_participants');
    }
};
