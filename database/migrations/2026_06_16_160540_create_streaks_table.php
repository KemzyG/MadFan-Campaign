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
        Schema::create('streaks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->integer('current_streak_days')->default(0);
            $table->integer('best_streak_days')->default(0);
            $table->timestamp('last_claimed_at')->nullable();
            $table->timestamp('next_claim_reset_at')->nullable();
            $table->decimal('current_multiplier', 5, 2)->default(1.00);
            $table->string('current_milestone_label')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('streaks');
    }
};
