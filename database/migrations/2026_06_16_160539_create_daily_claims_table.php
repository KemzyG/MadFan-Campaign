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
        Schema::create('daily_claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('season_id')->nullable()->constrained('seasons')->onDelete('cascade');
            $table->date('claim_date');
            $table->enum('status', ['claimed', 'missed', 'upcoming'])->default('upcoming');
            $table->integer('base_points');
            $table->decimal('multiplier', 5, 2)->default(1.00);
            $table->integer('points_earned')->default(0);
            $table->integer('streak_day_number')->default(0);
            $table->timestamp('claimed_at')->nullable();
            $table->foreignId('point_transaction_id')->nullable()->constrained('point_transactions')->onDelete('set null');
            $table->timestamps();
            $table->unique(['user_id', 'claim_date']);
            $table->index(['season_id', 'claim_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_claims');
    }
};
