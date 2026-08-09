<?php

namespace Database\Factories;

use App\Enums\MatchStatus;
use App\Models\Club;
use App\Models\MatchFixture;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MatchFixture>
 */
class MatchFixtureFactory extends Factory
{
    protected $model = MatchFixture::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $home = Club::factory();
        $away = Club::factory();

        return [
            'home_club_id' => $home,
            'away_club_id' => $away,
            'kickoff_at' => now()->addDays(fake()->numberBetween(3, 21))->setTime(15, 0),
            'venue' => fake()->city().' Stadium',
            'status' => MatchStatus::Upcoming,
            'price' => fake()->randomElement(['25.00', '35.00', '45.00', '55.00']),
            'competition' => fake()->randomElement(['Premier League', 'La Liga', 'Serie A', 'Friendly']),
        ];
    }

    public function upcoming(): static
    {
        return $this->state(fn (): array => [
            'status' => MatchStatus::Upcoming,
            'kickoff_at' => now()->addDays(7)->setTime(15, 0),
        ]);
    }

    public function finished(): static
    {
        return $this->state(fn (): array => [
            'status' => MatchStatus::Finished,
            'kickoff_at' => now()->subDays(3)->setTime(15, 0),
        ]);
    }

    public function live(): static
    {
        return $this->state(fn (): array => [
            'status' => MatchStatus::Live,
            'kickoff_at' => now()->subMinutes(30),
        ]);
    }
}
