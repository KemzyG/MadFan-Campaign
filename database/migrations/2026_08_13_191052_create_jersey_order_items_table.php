<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jersey_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jersey_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('jersey_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('jersey_variant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('size', 8);
            $table->decimal('unit_price', 10, 2);
            $table->unsignedInteger('quantity');
            $table->decimal('line_total', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jersey_order_items');
    }
};
