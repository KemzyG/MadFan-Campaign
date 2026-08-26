<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductVariant>
 */
class ProductVariantFactory extends Factory
{
    protected $model = ProductVariant::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'label' => fake()->randomElement(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
            'stock' => fake()->numberBetween(5, 40),
            'sku' => 'MF-'.fake()->unique()->bothify('??##??'),
            'price_override' => null,
        ];
    }

    public function outOfStock(): static
    {
        return $this->state(fn (): array => [
            'stock' => 0,
        ]);
    }

    public function unlimited(): static
    {
        return $this->state(fn (): array => [
            'stock' => null,
        ]);
    }

    public function label(string $label): static
    {
        return $this->state(fn (): array => [
            'label' => $label,
        ]);
    }
}
