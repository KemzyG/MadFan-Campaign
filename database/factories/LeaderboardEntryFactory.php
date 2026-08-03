<?php

namespace Database\Factories;

use App\Models\LeaderboardEntry;
use App\Models\LeaderboardSnapshot;
use App\Models\LoyaltyTier;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LeaderboardEntry>
 */
class LeaderboardEntryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'leaderboard_snapshot_id' => LeaderboardSnapshot::factory(),
            'user_id' => User::factory(),
            'loyalty_tier_id' => LoyaltyTier::factory(),
            'rank' => $this->faker->numberBetween(1, 1000),
            'points' => $this->faker->numberBetween(1000, 100000),
        ];
    }

    /**
     * Create a top-ranked entry.
     */
    public function topRank(): static
    {
        return $this->state(fn (array $attributes) => [
            'rank' => $this->faker->numberBetween(1, 10),
            'points' => $this->faker->numberBetween(50000, 100000),
        ]);
    }
}
