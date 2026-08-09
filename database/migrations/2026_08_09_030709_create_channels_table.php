<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('channels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('club_server_id')->constrained('club_servers')->cascadeOnDelete();
            $table->string('slug', 64);
            $table->string('name');
            $table->string('type', 32)->default('text');
            $table->string('topic')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->unsignedInteger('slowmode_seconds')->default(0);
            $table->boolean('is_read_only')->default(false);
            $table->timestamps();

            $table->unique(['club_server_id', 'slug']);
            $table->index(['club_server_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('channels');
    }
};
