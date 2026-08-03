<?php

namespace Database\Factories;

use App\Models\PointTransaction;
use App\Models\Referral;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Referral>
 */
class ReferralFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $status = $this->faker->randomElement(['pending', 'active', 'rewarded', 'rejected']);

        return [
            'referrer_user_id' => User::factory(),
            'referred_user_id' => User::factory(),
            'referred_email' => fake()->safeEmail(),
            'referred_user_handle' => fake()->userName(),
            'referral_code' => 'MF-'.strtoupper(fake()->bothify('?????')),
            'point_transaction_id' => null,
            'status' => $status,
            'points_awarded' => $status === 'rewarded' ? 500 : 0,
            'activated_at' => in_array($status, ['active', 'rewarded'], true) ? now()->subDays($this->faker->numberBetween(0, 7)) : null,
            'rewarded_at' => $status === 'rewarded' ? now()->subDays($this->faker->numberBetween(0, 7)) : null,
        ];
    }

    /**
     * Create a pending referral.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'points_awarded' => 0,
            'activated_at' => null,
            'rewarded_at' => null,
            'point_transaction_id' => null,
        ]);
    }

    /**
     * Create an active referral.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
            'points_awarded' => 0,
            'activated_at' => now()->subDays($this->faker->numberBetween(1, 7)),
            'rewarded_at' => null,
            'point_transaction_id' => null,
        ]);
    }

    /**
     * Create a rewarded referral.
     */
    public function rewarded(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rewarded',
            'points_awarded' => 500,
            'activated_at' => now()->subDays($this->faker->numberBetween(1, 7)),
            'rewarded_at' => now(),
            'point_transaction_id' => PointTransaction::factory(),
        ]);
    }
}
