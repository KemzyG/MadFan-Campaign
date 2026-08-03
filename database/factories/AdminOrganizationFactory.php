<?php

namespace Database\Factories;

use App\Models\AdminOrganization;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<AdminOrganization>
 */
class AdminOrganizationFactory extends Factory
{
    protected $model = AdminOrganization::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->company().' Ops';

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => fake()->optional()->sentence(),
            'partition_countries' => null,
            'partition_leagues' => null,
            'partition_clubs' => null,
            'is_active' => true,
        ];
    }

    /**
     * @param  list<string>  $countries
     */
    public function countries(array $countries): static
    {
        return $this->state(fn (): array => [
            'partition_countries' => $countries,
        ]);
    }

    /**
     * @param  list<string>  $leagues
     */
    public function leagues(array $leagues): static
    {
        return $this->state(fn (): array => [
            'partition_leagues' => $leagues,
        ]);
    }

    /**
     * @param  list<string>  $clubs
     */
    public function clubs(array $clubs): static
    {
        return $this->state(fn (): array => [
            'partition_clubs' => $clubs,
        ]);
    }
}
