<?php

namespace Database\Seeders;

use App\Models\Season;
use Illuminate\Database\Seeder;

class StreakMilestoneSeeder extends Seeder
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
                'day_count' => 7,
                'name' => 'First Week Champion',
                'bonus_points' => 50,
                'multiplier' => 1.25,
                'description' => 'Keep your streak going for 7 days straight!',
            ],
            [
                'day_count' => 14,
                'name' => 'Two Weeks Strong',
                'bonus_points' => 100,
                'multiplier' => 1.50,
                'description' => 'You\'re on fire! Keep it up for 14 days!',
            ],
            [
                'day_count' => 30,
                'name' => 'One Month Legend',
                'bonus_points' => 300,
                'multiplier' => 2.00,
                'description' => 'Incredible dedication! 30 days of consistency!',
            ],
            [
                'day_count' => 60,
                'name' => 'Two Months Elite',
                'bonus_points' => 500,
                'multiplier' => 2.50,
                'description' => 'You are an absolute legend! 60 days of excellence!',
            ],
        ];

        foreach ($milestones as $milestone) {
            $season->streakMilestones()->create($milestone);
        }
    }
}
