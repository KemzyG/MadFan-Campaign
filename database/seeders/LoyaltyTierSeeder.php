<?php

namespace Database\Seeders;

use App\Models\LoyaltyTier;
use Illuminate\Database\Seeder;

class LoyaltyTierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tiers = [
            [
                'code' => 'CORE_FAN',
                'name' => 'CORE FAN',
                'min_points' => 0,
                'max_points' => 999,
                'display_order' => 1,
            ],
            [
                'code' => 'ULTRA_FAN',
                'name' => 'ULTRA FAN',
                'min_points' => 1000,
                'max_points' => 4999,
                'display_order' => 2,
            ],
            [
                'code' => 'LEGEND_FAN',
                'name' => 'LEGEND FAN',
                'min_points' => 5000,
                'max_points' => null,
                'display_order' => 3,
            ],
        ];

        foreach ($tiers as $tierData) {
            $tier = LoyaltyTier::updateOrCreate(
                ['code' => $tierData['code']],
                $tierData,
            );

            // Create rewards for each tier (only if none exist yet)
            if ($tier->tierRewards()->count() > 0) {
                continue;
            }

            $rewards = match ($tier->code) {
                'CORE_FAN' => [
                    'Daily claim access',
                    'Basic task participation',
                    'Community badge',
                ],
                'ULTRA_FAN' => [
                    '2x bonus on daily claims',
                    'Exclusive tasks',
                    'Priority support',
                    'Ultra Fan badge',
                ],
                'LEGEND_FAN' => [
                    '3x bonus on daily claims',
                    'VIP-only events',
                    'Special merchandise',
                    'Direct community access',
                    'Legend Fan badge',
                ],
                default => [],
            };

            foreach ($rewards as $index => $rewardText) {
                $tier->tierRewards()->create([
                    'reward_text' => $rewardText,
                    'display_order' => $index + 1,
                ]);
            }
        }
    }
}
