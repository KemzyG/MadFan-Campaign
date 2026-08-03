<?php

namespace Database\Seeders;

use App\Models\Season;
use App\Models\SeasonWeek;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class SeasonSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();
        $startDate = $now->copy()->startOfMonth();
        $endDate = $now->copy()->endOfMonth();

        $season = Season::updateOrCreate(
            ['code' => 'S01'],
            [
                'name' => 'Season 01',
                'status' => 'active',
                'starts_at' => $startDate,
                'ends_at' => $endDate,
                'total_weeks' => 4,
            ]
        );

        // Skip week seeding if weeks already exist
        if ($season->seasonWeeks()->count() > 0) {
            return;
        }

        $weekNames = ['Kickoff', 'Build', 'Peak', 'Final'];
        $startDateWeek = $startDate->copy();
        $multipliers = [1.0, 1.25, 1.5, 2.0];
        $bonusPoints = [50, 100, 150, 200];

        for ($week = 1; $week <= 4; $week++) {
            $endDateWeek = $startDateWeek->copy()->addDays(6)->endOfDay();

            // Adjust last week to end on season end date
            if ($week === 4) {
                $endDateWeek = $endDate->copy()->endOfDay();
            }

            SeasonWeek::create([
                'season_id' => $season->id,
                'week_number' => $week,
                'code' => "W{$week}",
                'name' => $weekNames[$week - 1],
                'description' => "Week {$week} of the season",
                'starts_at' => $startDateWeek,
                'ends_at' => $endDateWeek,
                'point_multiplier' => $multipliers[$week - 1],
                'completion_bonus_points' => $bonusPoints[$week - 1],
                'is_active' => true,
            ]);

            $startDateWeek = $endDateWeek->copy()->addDay()->startOfDay();
        }
    }
}
