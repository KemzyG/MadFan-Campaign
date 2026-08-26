<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('social_daily_task_claims', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->date('claim_date');
            $table->unsignedTinyInteger('week_index');
            $table->unsignedInteger('points_awarded');
            $table->foreignId('point_transaction_id')->nullable()->constrained('point_transactions')->nullOnDelete();
            $table->timestamp('claimed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'claim_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_daily_task_claims');
    }
};
