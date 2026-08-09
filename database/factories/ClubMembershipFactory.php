<?php

namespace Database\Factories;

use App\Models\Club;
use App\Models\ClubMembership;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ClubMembership>
 */
class ClubMembershipFactory extends Factory
{
    protected $model = ClubMembership::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'club_id' => Club::factory(),
            'is_primary' => true,
            'role' => 'member',
            'notifications' => 'all',
        ];
    }

    public function primary(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_primary' => true,
        ]);
    }
}
