<?php

namespace Database\Factories;

use App\Models\PointTransaction;
use App\Models\Season;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PointTransaction>
 */
class PointTransactionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $transactionTypes = ['earned', 'redeemed', 'bonus', 'penalty'];
        $type = $this->faker->randomElement($transactionTypes);

        return [
            'user_id' => User::factory(),
            'season_id' => Season::factory(),
            'amount' => $this->faker->numberBetween(10, 1000),
            'transaction_type' => $type,
            'description' => $this->getDescriptionForType($type),
            'reference_id' => $this->faker->uuid(),
            'reference_type' => $this->faker->randomElement(['task', 'daily_claim', 'referral', 'milestone']),
        ];
    }

    /**
     * Create an earned transaction.
     */
    public function earned(): static
    {
        return $this->state(fn (array $attributes) => [
            'transaction_type' => 'earned',
            'amount' => $this->faker->numberBetween(10, 500),
            'description' => 'Points earned from task completion',
        ]);
    }

    /**
     * Create a bonus transaction.
     */
    public function bonus(): static
    {
        return $this->state(fn (array $attributes) => [
            'transaction_type' => 'bonus',
            'amount' => $this->faker->numberBetween(100, 500),
            'description' => 'Bonus points awarded',
        ]);
    }

    /**
     * Create a redeemed transaction.
     */
    public function redeemed(): static
    {
        return $this->state(fn (array $attributes) => [
            'transaction_type' => 'redeemed',
            'amount' => $this->faker->numberBetween(50, 300),
            'description' => 'Points redeemed for reward',
        ]);
    }

    /**
     * Get description based on transaction type.
     */
    private function getDescriptionForType(string $type): string
    {
        return match ($type) {
            'earned' => 'Points earned from activity',
            'redeemed' => 'Points redeemed for reward',
            'bonus' => 'Bonus points awarded',
            'penalty' => 'Points deducted',
            default => 'Transaction',
        };
    }
}
