<?php

namespace Database\Factories;

use App\Models\Passport;
use App\Models\Season;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Passport>
 */
class PassportFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'season_id' => Season::factory(),
            'tier_level' => $this->faker->randomElement(['core', 'ultra', 'legend']),
            'points_earned' => $this->faker->numberBetween(0, 10000),
            'status' => $this->faker->randomElement(['active', 'completed', 'archived']),
        ];
    }

    /**
     * Mark the passport as active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }

    /**
     * Mark the passport as completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'points_earned' => $this->faker->numberBetween(5000, 10000),
        ]);
    }
}
