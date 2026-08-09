<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('match_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('match_fixture_id')->constrained('match_fixtures')->cascadeOnDelete();
            $table->string('status', 32)->default('paid');
            $table->decimal('price', 8, 2);
            $table->string('section')->nullable();
            $table->string('seat')->nullable();
            $table->string('code', 32)->unique();
            $table->timestamp('purchased_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'match_fixture_id']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('match_tickets');
    }
};
