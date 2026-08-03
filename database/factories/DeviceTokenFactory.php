<?php

namespace Database\Factories;

use App\Models\DeviceToken;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DeviceToken>
 */
class DeviceTokenFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $platforms = ['ios', 'android', 'web'];
        $platform = $this->faker->randomElement($platforms);

        return [
            'user_id' => User::factory(),
            'token' => $this->generateTokenByPlatform($platform),
            'device_name' => $this->faker->word().' '.$this->faker->randomElement(['Pro', 'Max', 'Air']),
        ];
    }

    /**
     * Generate a token based on platform type.
     */
    private function generateTokenByPlatform(string $platform): string
    {
        return match ($platform) {
            'ios' => bin2hex(random_bytes(32)),
            'android' => bin2hex(random_bytes(32)),
            'web' => bin2hex(random_bytes(32)),
            default => bin2hex(random_bytes(32)),
        };
    }
}
