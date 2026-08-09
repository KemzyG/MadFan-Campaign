<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('match_fixtures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('home_club_id')->constrained('clubs')->cascadeOnDelete();
            $table->foreignId('away_club_id')->constrained('clubs')->cascadeOnDelete();
            $table->timestamp('kickoff_at');
            $table->string('venue');
            $table->string('status', 32)->default('upcoming');
            $table->decimal('price', 8, 2);
            $table->string('competition')->nullable();
            $table->timestamps();

            $table->index(['status', 'kickoff_at']);
            $table->index('kickoff_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('match_fixtures');
    }
};
