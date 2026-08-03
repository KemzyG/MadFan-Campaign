<?php

namespace Database\Factories;

use App\Models\LoyaltyTier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LoyaltyTier>
 */
class LoyaltyTierFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $tierNames = ['Core', 'Ultra', 'Legend', 'Champion', 'Elite'];
        $tierName = $this->faker->unique()->randomElement($tierNames);

        return [
            'name' => $tierName,
            'description' => 'Access to '.$tierName.' tier benefits and exclusive rewards',
            'points_required' => $this->faker->numberBetween(0, 100000),
            'benefits' => [
                'exclusive_rewards' => true,
                'priority_support' => true,
                'bonus_multiplier' => $this->faker->randomFloat(2, 1, 3),
                'early_access' => true,
            ],
        ];
    }

    /**
     * Create a core tier.
     */
    public function core(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Core',
            'points_required' => 0,
            'benefits' => [
                'bonus_multiplier' => 1.0,
                'exclusive_rewards' => false,
            ],
        ]);
    }

    /**
     * Create an ultra tier.
     */
    public function ultra(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Ultra',
            'points_required' => 10000,
            'benefits' => [
                'bonus_multiplier' => 1.5,
                'exclusive_rewards' => true,
            ],
        ]);
    }

    /**
     * Create a legend tier.
     */
    public function legend(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Legend',
            'points_required' => 50000,
            'benefits' => [
                'bonus_multiplier' => 2.0,
                'exclusive_rewards' => true,
                'priority_support' => true,
            ],
        ]);
    }
}
