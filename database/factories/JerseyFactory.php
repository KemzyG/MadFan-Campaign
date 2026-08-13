<?php

namespace Database\Factories;

use App\Models\Club;
use App\Models\Jersey;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Jersey>
 */
class JerseyFactory extends Factory
{
    protected $model = Jersey::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(3, true).' Jersey';

        return [
            'club_id' => Club::factory(),
            'name' => Str::title($name),
            'slug' => Str::slug($name).'-'.fake()->unique()->numerify('###'),
            'description' => fake()->sentence(12),
            'image' => null,
            'price' => fake()->randomElement(['49.99', '59.99', '69.99', '79.99']),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => [
            'is_active' => false,
        ]);
    }

    public function withoutClub(): static
    {
        return $this->state(fn (): array => [
            'club_id' => null,
        ]);
    }
}
