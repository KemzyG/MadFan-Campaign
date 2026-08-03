<?php

namespace Database\Seeders;

use App\Models\DeviceToken;
use App\Models\LoyaltyTier;
use App\Models\User;
use App\Models\Waitlist;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (! env('SEED_TEST_DATA', false)) {
            return;
        }

        // Get loyalty tiers
        $coreFan = LoyaltyTier::where('code', 'CORE_FAN')->first();
        $ultraFan = LoyaltyTier::where('code', 'ULTRA_FAN')->first();
        $legendFan = LoyaltyTier::where('code', 'LEGEND_FAN')->first();

        // Create test users with various tiers
        $testUsersData = [
            [
                'name' => 'John Core',
                'email' => 'john.core@example.com',
                'username' => 'johncore',
                'loyalty_tier_id' => $coreFan?->id,
                'total_points' => 500,
            ],
            [
                'name' => 'Sarah Ultra',
                'email' => 'sarah.ultra@example.com',
                'username' => 'sarraultra',
                'loyalty_tier_id' => $ultraFan?->id,
                'total_points' => 1500,
            ],
            [
                'name' => 'Mike Legend',
                'email' => 'mike.legend@example.com',
                'username' => 'mikelegend',
                'loyalty_tier_id' => $legendFan?->id,
                'total_points' => 6000,
            ],
            [
                'name' => 'Emma Active',
                'email' => 'emma.active@example.com',
                'username' => 'emmaactive',
                'loyalty_tier_id' => $ultraFan?->id,
                'total_points' => 2000,
            ],
            [
                'name' => 'David Super',
                'email' => 'david.super@example.com',
                'username' => 'davidsuper',
                'loyalty_tier_id' => $legendFan?->id,
                'total_points' => 8000,
            ],
        ];

        $platforms = ['ios', 'android', 'web'];
        $countries = ['US', 'UK', 'CA', 'AU', 'IN'];
        $clubs = ['Manchester United', 'Liverpool', 'Chelsea', 'Arsenal', 'Tottenham'];

        foreach ($testUsersData as $index => $userData) {
            $user = User::create([
                ...$userData,
                'password_hash' => Hash::make('password123'),
                'auth_provider' => 'password',
                'fan_id' => 'MF-'.str_pad($index + 10000, 5, '0', STR_PAD_LEFT),
                'country' => $countries[$index % count($countries)],
                'club' => $clubs[$index % count($clubs)],
            ]);

            // Create device tokens for each user
            $deviceCount = random_int(1, 3);
            for ($i = 0; $i < $deviceCount; $i++) {
                DeviceToken::create([
                    'user_id' => $user->id,
                    'token' => 'fcm_'.bin2hex(random_bytes(32)),
                    'platform' => $platforms[array_rand($platforms)],
                    'last_registered_at' => now(),
                ]);
            }

            // Create waitlist entries
            Waitlist::create([
                'full_name' => $user->name,
                'email' => $user->email,
                'country' => $user->country,
                'club' => $user->club,
                'source' => 'organic',
                'user_id' => $user->id,
            ]);
        }
    }
}
