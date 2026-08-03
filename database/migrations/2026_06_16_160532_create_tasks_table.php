<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('season_id')->nullable()->constrained('seasons')->onDelete('cascade');
            $table->foreignId('season_week_id')->nullable()->constrained('season_weeks')->onDelete('cascade');
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description');
            $table->integer('points');
            $table->string('platform');
            $table->string('task_type');
            $table->string('external_url')->nullable();
            $table->boolean('verification_required')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('display_order');
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();
            $table->index(['season_id', 'season_week_id']);
            $table->index(['is_active', 'display_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
