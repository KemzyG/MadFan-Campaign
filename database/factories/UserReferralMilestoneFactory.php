<?php

namespace Database\Factories;

use App\Models\PointTransaction;
use App\Models\ReferralMilestone;
use App\Models\User;
use App\Models\UserReferralMilestone;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UserReferralMilestone>
 */
class UserReferralMilestoneFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $status = $this->faker->randomElement(['pending', 'achieved']);

        return [
            'user_id' => User::factory(),
            'referral_milestone_id' => ReferralMilestone::factory(),
            'point_transaction_id' => null,
            'achieved_at' => $status === 'achieved' ? now()->subDays($this->faker->numberBetween(0, 30)) : null,
            'status' => $status,
        ];
    }

    /**
     * Create an achieved milestone.
     */
    public function achieved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'achieved',
            'achieved_at' => now()->subDays($this->faker->numberBetween(0, 30)),
            'point_transaction_id' => PointTransaction::factory(),
        ]);
    }

    /**
     * Create a pending milestone.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'achieved_at' => null,
        ]);
    }
}
