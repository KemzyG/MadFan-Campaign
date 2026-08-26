<?php

namespace Database\Factories;

use App\Enums\ProductOrderStatus;
use App\Models\ProductOrder;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductOrder>
 */
class ProductOrderFactory extends Factory
{
    protected $model = ProductOrder::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'status' => ProductOrderStatus::Pending,
            'code' => ProductOrder::generateCode(),
            'total' => '0.00',
            'currency' => 'GBP',
            'requires_shipping' => true,
            'shipping_name' => fake()->name(),
            'shipping_line1' => fake()->streetAddress(),
            'shipping_line2' => null,
            'shipping_city' => fake()->city(),
            'shipping_postcode' => fake()->postcode(),
            'shipping_country' => 'GB',
        ];
    }

    public function confirmed(): static
    {
        return $this->state(fn (): array => [
            'status' => ProductOrderStatus::Confirmed,
            'confirmed_at' => now(),
        ]);
    }
}
