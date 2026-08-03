<?php

namespace Database\Seeders;

use App\Models\Season;
use Illuminate\Database\Seeder;

class EarnSourceSeeder extends Seeder
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

        $sources = [
            [
                'name' => 'Daily Claim',
                'description' => 'Claim your daily points bonus',
                'points_min' => 10,
                'points_max' => 50,
                'points_label' => '10-50 points',
                'display_order' => 1,
            ],
            [
                'name' => 'Weekly Tasks',
                'description' => 'Complete weekly tasks for significant points',
                'points_min' => 50,
                'points_max' => 500,
                'points_label' => '50-500 points',
                'display_order' => 2,
            ],
            [
                'name' => 'Referrals',
                'description' => 'Earn points from successful referrals',
                'points_min' => 100,
                'points_max' => 1000,
                'points_label' => '100-1000 points',
                'display_order' => 3,
            ],
            [
                'name' => 'Bonuses',
                'description' => 'Special bonus points from events and achievements',
                'points_min' => 50,
                'points_max' => 500,
                'points_label' => '50-500 points',
                'display_order' => 4,
            ],
        ];

        foreach ($sources as $source) {
            $season->earnSources()->create($source);
        }
    }
}
