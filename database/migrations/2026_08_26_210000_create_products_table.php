<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The general storefront catalog: apparel (kits, boots, socks, caps,
     * training gear), collectibles (player NFT cards), and subscriptions
     * (streaming/gaming credits) — across every fandom, not just football.
     * fandom_id/club_id are both nullable because a product like a Netflix
     * subscription or a boot brand isn't tied to either.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('fandom_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('club_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_type');
            $table->string('category');
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('brand')->nullable();
            $table->string('image')->nullable();
            $table->json('gallery')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('currency', 3)->default('GBP');
            $table->boolean('is_digital')->default(false);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->json('attributes')->nullable();
            $table->timestamps();

            $table->index(['product_type', 'is_active']);
            $table->index(['category', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
