<?php

namespace Database\Factories;

use App\Models\Fandom;
use App\Models\FandomSubset;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<FandomSubset>
 */
class FandomSubsetFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = ucwords($this->faker->unique()->words(2, true));

        return [
            'fandom_id' => Fandom::factory(),
            'name' => $name,
            'slug' => Str::slug($name).'-'.$this->faker->unique()->numberBetween(1000, 9999),
            'image' => null,
            'fan_count' => $this->faker->numberBetween(0, 25000),
            'is_trending' => false,
            'sort_order' => 0,
        ];
    }

    public function trending(): static
    {
        return $this->state(fn () => ['is_trending' => true]);
    }
}
