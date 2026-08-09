<?php

namespace Database\Factories;

use App\Models\Club;
use App\Models\ClubServer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ClubServer>
 */
class ClubServerFactory extends Factory
{
    protected $model = ClubServer::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $club = Club::factory();

        return [
            'club_id' => $club,
            'name' => fake()->company().' Terrace',
        ];
    }

    public function forClub(Club $club): static
    {
        return $this->state(fn (array $attributes) => [
            'club_id' => $club->id,
            'name' => $club->name.' Terrace',
        ]);
    }
}
