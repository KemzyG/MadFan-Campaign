<?php

namespace Database\Factories;

use App\Enums\JerseySize;
use App\Models\Jersey;
use App\Models\JerseyVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JerseyVariant>
 */
class JerseyVariantFactory extends Factory
{
    protected $model = JerseyVariant::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $size = fake()->randomElement(JerseySize::cases());

        return [
            'jersey_id' => Jersey::factory(),
            'size' => $size,
            'stock' => fake()->numberBetween(5, 40),
            'sku' => 'JY-'.fake()->unique()->bothify('??##??'),
        ];
    }

    public function outOfStock(): static
    {
        return $this->state(fn (): array => [
            'stock' => 0,
        ]);
    }

    public function size(JerseySize $size): static
    {
        return $this->state(fn (): array => [
            'size' => $size,
        ]);
    }
}
