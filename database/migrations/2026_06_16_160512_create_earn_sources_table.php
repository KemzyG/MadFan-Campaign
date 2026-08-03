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
        Schema::create('earn_sources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('season_id')->nullable()->constrained('seasons')->onDelete('cascade');
            $table->string('name');
            $table->integer('points_min')->nullable();
            $table->integer('points_max')->nullable();
            $table->string('points_label');
            $table->text('description');
            $table->integer('display_order');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('earn_sources');
    }
};
