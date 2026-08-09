<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stage_signals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stage_id')->constrained('stages')->cascadeOnDelete();
            $table->foreignId('from_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('to_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 16);
            $table->json('payload');
            $table->timestamp('consumed_at')->nullable();
            $table->timestamps();

            $table->index(['stage_id', 'to_user_id', 'consumed_at', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stage_signals');
    }
};
