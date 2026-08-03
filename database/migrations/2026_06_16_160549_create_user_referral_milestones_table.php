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
        Schema::create('user_referral_milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('referral_milestone_id')->constrained('referral_milestones')->onDelete('cascade');
            $table->enum('status', ['locked', 'next', 'done'])->default('locked');
            $table->integer('progress_count')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('point_transaction_id')->nullable()->constrained('point_transactions')->onDelete('set null');
            $table->timestamps();
            $table->unique(['user_id', 'referral_milestone_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_referral_milestones');
    }
};
