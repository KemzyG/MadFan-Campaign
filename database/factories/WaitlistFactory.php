<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Waitlist;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Waitlist>
 */
class WaitlistFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'full_name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'country' => fake()->countryCode(),
            'club' => fake()->randomElement(['Arsenal', 'Chelsea', 'Liverpool', 'Manchester United']),
            'league' => fake()->optional()->word(),
            'source' => fake()->optional()->randomElement(['organic', 'referral', 'social']),
            'user_id' => null,
        ];
    }

    /**
     * Associate the waitlist entry with a user.
     */
    public function forUser(?User $user = null): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => ($user ?? User::factory())->id,
        ]);
    }
}
