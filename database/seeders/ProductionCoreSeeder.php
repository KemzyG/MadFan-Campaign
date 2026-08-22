<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Idempotent production bootstrap (no TestData / Faker factories).
 * Run: php artisan db:seed --class=ProductionCoreSeeder --force
 */
class ProductionCoreSeeder extends Seeder
{
    public function run(): void
    {
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
            EarnSourceSeeder::class,
            ClubSeeder::class,
            MatchSeeder::class,
            LeagueStandingSeeder::class,
            SettingSeeder::class,
            SportsPostSeeder::class,
            LandingMediaSeeder::class,
            VideoHighlightSeeder::class,
        ]);
    }
}
