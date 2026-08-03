<?php

namespace Database\Factories;

use App\Enums\SocialPlatform;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SocialAccount>
 */
class SocialAccountFactory extends Factory
{
    protected $model = SocialAccount::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'platform' => SocialPlatform::X,
            'platform_user_id' => (string) fake()->unique()->numberBetween(100000, 999999999),
            'username' => '@'.fake()->unique()->userName(),
            'display_name' => fake()->name(),
            'metadata' => null,
            'connected_at' => now(),
            'verified_at' => now(),
        ];
    }

    public function x(?string $username = null): static
    {
        $handle = $username ?? '@'.fake()->userName();

        return $this->state(fn (): array => [
            'platform' => SocialPlatform::X,
            'username' => str_starts_with($handle, '@') ? $handle : '@'.$handle,
        ]);
    }

    public function discord(?string $username = null): static
    {
        return $this->state(fn (): array => [
            'platform' => SocialPlatform::Discord,
            'username' => $username ?? fake()->userName(),
        ]);
    }

    public function telegram(?string $userId = null): static
    {
        return $this->state(fn (): array => [
            'platform' => SocialPlatform::Telegram,
            'platform_user_id' => $userId ?? (string) fake()->numberBetween(100000, 999999999),
            'username' => null,
        ]);
    }
}
