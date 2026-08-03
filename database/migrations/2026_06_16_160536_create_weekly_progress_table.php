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
        Schema::create('weekly_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('season_id')->constrained('seasons')->onDelete('cascade');
            $table->foreignId('season_week_id')->constrained('season_weeks')->onDelete('cascade');
            $table->integer('tasks_done')->default(0);
            $table->integer('tasks_total')->default(0);
            $table->boolean('completion_bonus_awarded')->default(false);
            $table->integer('completion_bonus_points')->default(0);
            $table->foreignId('completion_bonus_transaction_id')->nullable()->constrained('point_transactions')->onDelete('set null');
            $table->timestamps();
            $table->unique(['user_id', 'season_week_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('weekly_progress');
    }
};
