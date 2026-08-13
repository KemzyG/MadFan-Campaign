<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jersey_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jersey_id')->constrained()->cascadeOnDelete();
            $table->string('size', 8);
            $table->unsignedInteger('stock')->default(0);
            $table->string('sku')->nullable()->unique();
            $table->timestamps();

            $table->unique(['jersey_id', 'size']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jersey_variants');
    }
};
