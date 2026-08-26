<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * name/variant_label/product_type are snapshotted at purchase time so an
     * order's receipt never changes even if the catalog entry is edited or
     * removed later (product_id/product_variant_id are nullable for that
     * reason — history survives deletion).
     */
    public function up(): void
    {
        Schema::create('product_order_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_variant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('variant_label')->nullable();
            $table->string('product_type');
            $table->decimal('unit_price', 10, 2);
            $table->integer('quantity');
            $table->decimal('line_total', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_order_items');
    }
};
