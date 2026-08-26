<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_predictions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('prediction_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('choice', 8);
            $table->boolean('is_correct')->nullable();
            $table->unsignedSmallInteger('points_awarded')->nullable();
            $table->foreignId('point_transaction_id')->nullable()->constrained('point_transactions')->nullOnDelete();
            $table->timestamps();

            $table->unique(['prediction_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_predictions');
    }
};
