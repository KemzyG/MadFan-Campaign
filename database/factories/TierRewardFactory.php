<?php

namespace Database\Factories;

use App\Models\LoyaltyTier;
use App\Models\TierReward;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TierReward>
 */
class TierRewardFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $rewardTypes = ['badge', 'discount', 'exclusive_item', 'experience_boost'];
        $rewardType = $this->faker->randomElement($rewardTypes);

        return [
            'loyalty_tier_id' => LoyaltyTier::factory(),
            'name' => $this->faker->word().' Reward',
            'description' => $this->faker->sentence(),
            'reward_value' => $this->faker->numberBetween(100, 5000),
            'reward_type' => $rewardType,
        ];
    }

    /**
     * Create a badge reward.
     */
    public function badge(): static
    {
        return $this->state(fn (array $attributes) => [
            'reward_type' => 'badge',
            'reward_value' => 0,
            'name' => 'Exclusive Badge',
        ]);
    }

    /**
     * Create a discount reward.
     */
    public function discount(): static
    {
        return $this->state(fn (array $attributes) => [
            'reward_type' => 'discount',
            'reward_value' => $this->faker->randomElement([10, 15, 20, 25]),
            'name' => 'Tier Discount',
        ]);
    }
}
