<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Generic variant: a size for a kit, a duration for a subscription, an
     * edition for a collectible — all just a label. `stock` null means
     * unlimited (digital goods); a number means tracked physical/limited
     * stock (apparel sizes, 1-of-1 collectibles).
     */
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->integer('stock')->nullable();
            $table->string('sku')->nullable();
            $table->decimal('price_override', 10, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
