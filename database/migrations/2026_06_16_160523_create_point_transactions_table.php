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
        Schema::create('point_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('season_id')->nullable()->constrained('seasons')->onDelete('cascade');
            $table->enum('source_type', ['task', 'daily_claim', 'referral', 'bonus', 'club_pick', 'admin_adjustment', 'penalty_shootout']);
            $table->string('source_id')->nullable();
            $table->integer('amount');
            $table->integer('balance_after');
            $table->string('reason');
            $table->json('metadata')->nullable();
            $table->string('idempotency_key')->unique()->nullable();
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
            $table->index('season_id');
            $table->index(['source_type', 'source_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('point_transactions');
    }
};
