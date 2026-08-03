<?php

namespace Database\Factories;

use App\Models\ReferralMilestone;
use App\Models\Season;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ReferralMilestone>
 */
class ReferralMilestoneFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $milestoneNumber = $this->faker->unique()->numberBetween(1, 10);

        return [
            'season_id' => Season::factory(),
            'milestone_number' => $milestoneNumber,
            'referral_count_required' => $milestoneNumber * 5,
            'reward_points' => $milestoneNumber * 500,
            'reward_description' => 'Milestone '.$milestoneNumber.' referral reward',
            'status' => $this->faker->randomElement(['active', 'inactive']),
        ];
    }

    /**
     * Create an active milestone.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }
}
