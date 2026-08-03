<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leagues', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('short', 32);
            $table->string('logo')->nullable();
            $table->timestamps();

            $table->unique('short');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leagues');
    }
};
