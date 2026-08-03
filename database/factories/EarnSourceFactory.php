<?php

namespace Database\Factories;

use App\Models\EarnSource;
use App\Models\Season;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EarnSource>
 */
class EarnSourceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $sourceNames = [
            'Daily Tasks',
            'Weekly Challenges',
            'Referrals',
            'Streak Bonus',
            'Milestone Rewards',
            'Tier Benefits',
            'Events',
            'Special Promotions',
        ];

        $name = $this->faker->randomElement($sourceNames);

        return [
            'season_id' => Season::factory(),
            'name' => $name,
            'description' => 'Earn points from '.$name,
            'base_points' => $this->faker->numberBetween(10, 1000),
            'multiplier' => $this->faker->randomFloat(2, 1.0, 3.0),
            'status' => $this->faker->randomElement(['active', 'inactive']),
        ];
    }

    /**
     * Create an active earn source.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }

    /**
     * Create a daily tasks source.
     */
    public function dailyTasks(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Daily Tasks',
            'description' => 'Earn points from Daily Tasks',
            'base_points' => 10,
            'multiplier' => 1.0,
        ]);
    }
}
