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
        Schema::create('referrals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referrer_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('referred_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('referred_email')->nullable();
            $table->string('referred_user_handle')->nullable();
            $table->string('referral_code');
            $table->enum('status', ['pending', 'active', 'rejected', 'rewarded'])->default('pending');
            $table->integer('points_awarded')->default(0);
            $table->foreignId('point_transaction_id')->nullable()->constrained('point_transactions')->onDelete('set null');
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('rewarded_at')->nullable();
            $table->timestamps();
            $table->index('referrer_user_id');
            $table->index('referred_user_id');
            $table->index('referral_code');
            $table->unique(['referrer_user_id', 'referred_user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('referrals');
    }
};
