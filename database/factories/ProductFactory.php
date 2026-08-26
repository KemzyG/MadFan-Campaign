<?php

namespace Database\Factories;

use App\Enums\ProductType;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(3, true).' Kit';

        return [
            'fandom_id' => null,
            'club_id' => null,
            'product_type' => ProductType::Apparel,
            'category' => 'kit',
            'name' => Str::title($name),
            'slug' => Str::slug($name).'-'.fake()->unique()->numerify('###'),
            'description' => fake()->sentence(12),
            'brand' => null,
            'image' => null,
            'gallery' => null,
            'price' => fake()->randomElement(['49.99', '59.99', '69.99', '79.99']),
            'currency' => 'GBP',
            'is_digital' => false,
            'is_active' => true,
            'is_featured' => false,
            'attributes' => null,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => [
            'is_active' => false,
        ]);
    }

    public function featured(): static
    {
        return $this->state(fn (): array => [
            'is_featured' => true,
        ]);
    }

    public function collectible(): static
    {
        return $this->state(fn (): array => [
            'product_type' => ProductType::Collectible,
            'category' => 'nft',
            'name' => Str::title(fake()->unique()->words(3, true).' Collectible'),
            'is_digital' => true,
            'price' => fake()->randomElement(['24.99', '49.99', '99.99']),
            'attributes' => ['edition' => '1 of '.fake()->numberBetween(1, 500), 'rarity' => fake()->randomElement(['Common', 'Rare', 'Legendary'])],
        ]);
    }

    public function subscription(): static
    {
        return $this->state(fn (): array => [
            'product_type' => ProductType::Subscription,
            'category' => 'streaming',
            'name' => Str::title(fake()->unique()->company().' Subscription'),
            'is_digital' => true,
            'price' => fake()->randomElement(['4.99', '9.99', '14.99']),
            'attributes' => ['delivery' => 'Redemption code emailed after purchase'],
        ]);
    }
}
