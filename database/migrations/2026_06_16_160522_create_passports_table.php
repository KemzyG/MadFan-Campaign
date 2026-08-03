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
        Schema::create('passports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->foreignId('season_id')->constrained('seasons')->onDelete('cascade');
            $table->string('qr_value');
            $table->string('referral_link');
            $table->string('share_slug')->unique();
            $table->boolean('is_public')->default(false);
            $table->timestamp('last_shared_at')->nullable();
            $table->string('snapshot_name')->nullable();
            $table->string('snapshot_handle')->nullable();
            $table->string('snapshot_club')->nullable();
            $table->string('snapshot_tier')->nullable();
            $table->integer('snapshot_points')->nullable();
            $table->integer('snapshot_streak_days')->nullable();
            $table->integer('snapshot_referral_count')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('passports');
    }
};
