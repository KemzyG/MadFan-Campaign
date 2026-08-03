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
        Schema::create('season_weeks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('season_id')->constrained('seasons')->onDelete('cascade');
            $table->integer('week_number');
            $table->string('code');
            $table->string('name');
            $table->text('description');
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->decimal('point_multiplier', 5, 2);
            $table->integer('completion_bonus_points');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['season_id', 'week_number']);
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('season_weeks');
    }
};
