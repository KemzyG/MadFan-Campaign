<?php

use App\Models\ReferralMilestone;
use Database\Seeders\ReferralMilestoneSeeder;
use Database\Seeders\SeasonSeeder;

test('users can view referral progress', function () {
    $user = createUser(['referral_count' => 2]);
    $this->seed([
        SeasonSeeder::class,
        ReferralMilestoneSeeder::class,
    ]);

    $this->withHeaders(pasetoHeaders($user))
        ->getJson('/api/referrals')
        ->assertSuccessful()
        ->assertJsonPath('referral_count', 2)
        ->assertJsonStructure(['referral_link', 'milestones', 'referred_fans']);
});

test('users can claim an eligible referral milestone', function () {
    $user = createUser(['referral_count' => 0, 'total_points' => 0]);
    $this->seed([
        SeasonSeeder::class,
        ReferralMilestoneSeeder::class,
    ]);

    $milestone = ReferralMilestone::orderBy('target_count')->first();
    expect($milestone)->not->toBeNull();

    $user->update(['referral_count' => $milestone->target_count]);

    $this->withHeaders(pasetoHeaders($user))
        ->postJson('/api/referrals/claim-milestone', [
            'referral_milestone_id' => $milestone->id,
        ])
        ->assertSuccessful();
});
