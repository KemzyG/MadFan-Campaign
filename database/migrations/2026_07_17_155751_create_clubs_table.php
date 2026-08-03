<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clubs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('league_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('short', 32);
            $table->string('logo')->nullable();
            $table->timestamps();

            $table->unique(['league_id', 'short']);
            $table->index('name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clubs');
    }
};
