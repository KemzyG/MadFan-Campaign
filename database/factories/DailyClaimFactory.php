<?php

namespace Database\Factories;

use App\Models\DailyClaim;
use App\Models\PointTransaction;
use App\Models\Season;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DailyClaim>
 */
class DailyClaimFactory extends Factory
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
            'point_transaction_id' => PointTransaction::factory(),
            'claim_date' => $this->faker->dateTimeBetween('-30 days', 'now'),
            'streak_number' => $this->faker->numberBetween(1, 30),
            'points_claimed' => $this->faker->numberBetween(10, 100),
            'claimed_at' => $this->faker->dateTimeBetween('-30 days', 'now'),
        ];
    }

    /**
     * Create a recent claim.
     */
    public function recent(): static
    {
        return $this->state(fn (array $attributes) => [
            'claim_date' => now()->toDateString(),
            'claimed_at' => now(),
            'streak_number' => $this->faker->numberBetween(1, 7),
        ]);
    }

    /**
     * Create a streak milestone claim.
     */
    public function milestone(): static
    {
        return $this->state(fn (array $attributes) => [
            'streak_number' => $this->faker->randomElement([7, 14, 21, 30]),
            'points_claimed' => $this->faker->numberBetween(100, 500),
        ]);
    }
}
