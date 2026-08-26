<?php

namespace Database\Factories;

use App\Enums\ProductType;
use App\Models\Product;
use App\Models\ProductOrder;
use App\Models\ProductOrderItem;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductOrderItem>
 */
class ProductOrderItemFactory extends Factory
{
    protected $model = ProductOrderItem::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_order_id' => ProductOrder::factory(),
            'product_id' => Product::factory(),
            'product_variant_id' => ProductVariant::factory(),
            'name' => fake()->words(3, true),
            'variant_label' => 'M',
            'product_type' => ProductType::Apparel,
            'unit_price' => '49.99',
            'quantity' => 1,
            'line_total' => '49.99',
        ];
    }
}
