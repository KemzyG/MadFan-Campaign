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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique()->nullable();
            $table->string('password_hash')->nullable();
            $table->string('firebase_uid')->unique()->nullable();
            $table->string('auth_provider'); // password, firebase, google
            $table->string('name');
            $table->string('username')->unique();
            $table->string('handle')->nullable();
            $table->string('fan_id')->unique(); // e.g., MF-48312
            $table->string('country')->nullable();
            $table->string('league')->nullable();
            $table->string('club')->nullable();
            $table->string('avatar_emoji')->nullable();
            // FK added after loyalty_tiers is created (see loyalty_tiers migration).
            $table->foreignId('loyalty_tier_id')->nullable()->index();
            $table->integer('total_points')->default(0);
            $table->integer('current_streak_days')->default(0);
            $table->integer('best_streak_days')->default(0);
            $table->integer('referral_count')->default(0);
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->index('total_points');
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
