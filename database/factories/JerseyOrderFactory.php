<?php

namespace Database\Factories;

use App\Enums\JerseyOrderStatus;
use App\Models\JerseyOrder;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<JerseyOrder>
 */
class JerseyOrderFactory extends Factory
{
    protected $model = JerseyOrder::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'status' => JerseyOrderStatus::Confirmed,
            'code' => 'JY'.Str::upper(Str::random(10)),
            'total' => '59.99',
            'shipping_name' => fake()->name(),
            'shipping_line1' => fake()->streetAddress(),
            'shipping_line2' => null,
            'shipping_city' => fake()->city(),
            'shipping_postcode' => fake()->postcode(),
            'shipping_country' => 'GB',
            'confirmed_at' => now(),
            'fulfilled_at' => null,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (): array => [
            'status' => JerseyOrderStatus::Pending,
            'confirmed_at' => null,
        ]);
    }

    public function confirmed(): static
    {
        return $this->state(fn (): array => [
            'status' => JerseyOrderStatus::Confirmed,
            'confirmed_at' => now(),
        ]);
    }

    public function fulfilled(): static
    {
        return $this->state(fn (): array => [
            'status' => JerseyOrderStatus::Fulfilled,
            'confirmed_at' => now()->subDay(),
            'fulfilled_at' => now(),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (): array => [
            'status' => JerseyOrderStatus::Cancelled,
            'confirmed_at' => null,
            'fulfilled_at' => null,
        ]);
    }
}
