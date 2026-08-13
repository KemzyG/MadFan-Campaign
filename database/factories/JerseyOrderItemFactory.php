<?php

namespace Database\Factories;

use App\Enums\JerseySize;
use App\Models\Jersey;
use App\Models\JerseyOrder;
use App\Models\JerseyOrderItem;
use App\Models\JerseyVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JerseyOrderItem>
 */
class JerseyOrderItemFactory extends Factory
{
    protected $model = JerseyOrderItem::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $unitPrice = '59.99';
        $quantity = 1;

        return [
            'jersey_order_id' => JerseyOrder::factory(),
            'jersey_id' => Jersey::factory(),
            'jersey_variant_id' => JerseyVariant::factory(),
            'name' => 'Home Kit Jersey',
            'size' => JerseySize::M,
            'unit_price' => $unitPrice,
            'quantity' => $quantity,
            'line_total' => $unitPrice,
        ];
    }
}
