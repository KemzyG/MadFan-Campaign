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
        Schema::create('loyalty_tiers', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->integer('min_points');
            $table->integer('max_points')->nullable();
            $table->integer('display_order');
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('loyalty_tier_id')
                ->references('id')
                ->on('loyalty_tiers')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['loyalty_tier_id']);
        });

        Schema::dropIfExists('loyalty_tiers');
    }
};
