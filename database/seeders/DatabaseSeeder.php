<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Run seeders in proper order
        $this->call([
            RoleSeeder::class,
            AdminPermissionsSeeder::class,
            FilamentAdminSeeder::class,
            AdminOrganizationSeeder::class,
            LoyaltyTierSeeder::class,
            SeasonSeeder::class,
            StreakMilestoneSeeder::class,
            ReferralMilestoneSeeder::class,
            TaskSeeder::class,
            StaffPositionSeeder::class,
            EarnSourceSeeder::class,
            ClubSeeder::class,
            ClubChatSeeder::class,
            MatchSeeder::class,
            LeagueStandingSeeder::class,
            JerseySeeder::class,
            LandingMediaSeeder::class,
            TestDataSeeder::class,
            SettingSeeder::class,
        ]);
    }
}
