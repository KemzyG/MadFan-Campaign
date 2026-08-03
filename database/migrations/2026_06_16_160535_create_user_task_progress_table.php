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
        Schema::create('user_task_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade');
            $table->foreignId('season_id')->nullable()->constrained('seasons')->onDelete('cascade');
            $table->foreignId('season_week_id')->nullable()->constrained('season_weeks')->onDelete('cascade');
            $table->enum('status', ['pending', 'confirmed', 'claimed', 'failed', 'rejected'])->default('pending');
            $table->boolean('is_checked')->default(false);
            $table->enum('verification_status', ['not_required', 'pending', 'verified', 'failed'])->default('not_required');
            $table->string('proof_url')->nullable();
            $table->string('external_handle')->nullable();
            $table->string('external_post_id')->nullable();
            $table->json('verification_payload')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('claimed_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->text('failure_reason')->nullable();
            $table->integer('points_awarded')->default(0);
            $table->foreignId('point_transaction_id')->nullable()->constrained('point_transactions')->onDelete('set null');
            $table->timestamps();
            $table->unique(['user_id', 'task_id']);
            $table->index(['user_id', 'status']);
            $table->index(['season_id', 'season_week_id']);
            $table->index('verification_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_task_progress');
    }
};
