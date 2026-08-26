<?php

namespace Database\Factories;

use App\Models\Fandom;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Fandom>
 */
class FandomFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = ucwords($this->faker->unique()->words(2, true));

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => $this->faker->sentence(),
            'is_active' => true,
            'group' => $this->faker->randomElement(['sports', 'esports', 'music', 'books']),
            'icon' => $this->faker->randomElement(['⚽', '🎮', '🏏', '🏈', '🎾', '🏁', '🎧', '📖']),
            'cover_image' => null,
        ];
    }
}
