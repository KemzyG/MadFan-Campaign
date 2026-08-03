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
        Schema::create('tier_rewards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loyalty_tier_id')->constrained('loyalty_tiers')->onDelete('cascade');
            $table->string('reward_text');
            $table->integer('display_order');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tier_rewards');
    }
};
