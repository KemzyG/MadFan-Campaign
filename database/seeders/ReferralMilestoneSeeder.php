<?php

namespace Database\Seeders;

use App\Models\Season;
use Illuminate\Database\Seeder;

class ReferralMilestoneSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $season = Season::where('status', 'active')->first();

        if (! $season) {
            return;
        }

        $milestones = [
            [
                'target_count' => 5,
                'reward_name' => 'Referral Star',
                'reward_description' => 'Congratulations! You have referred 5 friends.',
                'bonus_points' => 500,
                'display_order' => 1,
            ],
            [
                'target_count' => 10,
                'reward_name' => 'Referral Master',
                'reward_description' => 'Awesome! You have referred 10 friends.',
                'bonus_points' => 1500,
                'display_order' => 2,
            ],
            [
                'target_count' => 25,
                'reward_name' => 'Referral Champion',
                'reward_description' => 'Incredible! You have referred 25 friends.',
                'bonus_points' => 5000,
                'display_order' => 3,
            ],
            [
                'target_count' => 50,
                'reward_name' => 'Referral Legend',
                'reward_description' => 'Legendary! You have referred 50 friends. You are a true brand ambassador!',
                'bonus_points' => 15000,
                'display_order' => 4,
            ],
        ];

        foreach ($milestones as $milestone) {
            $season->referralMilestones()->create($milestone);
        }
    }
}
