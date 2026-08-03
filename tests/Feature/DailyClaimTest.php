<?php

use App\Models\Streak;
use Database\Seeders\SeasonSeeder;
use Database\Seeders\StreakMilestoneSeeder;
use Illuminate\Support\Carbon;

test('users can view daily claim status', function () {
    $user = createUser();
    $this->seed(SeasonSeeder::class);

    $this->withHeaders(pasetoHeaders($user))
        ->getJson('/api/daily-claim')
        ->assertSuccessful()
        ->assertJsonStructure([
            'is_available',
            'next_reset_at',
            'streak',
            'points_preview',
            'milestones',
            'history',
        ])
        ->assertJsonPath('is_available', true)
        ->assertJsonPath('next_reset_at', null);
});

test('users can claim daily rewards once per 24 hours', function () {
    Carbon::setTestNow(Carbon::parse('2026-07-12 15:30:00'));

    $user = createUser(['total_points' => 0]);
    $this->seed([
        SeasonSeeder::class,
        StreakMilestoneSeeder::class,
    ]);

    $response = $this->withHeaders(pasetoHeaders($user))
        ->postJson('/api/daily-claim');

    $response->assertCreated()
        ->assertJsonPath('streak_day', 1)
        ->assertJsonPath('next_reset_at', Carbon::parse('2026-07-13 15:30:00')->toIso8601String());

    $user->refresh();
    expect($user->total_points)->toBeGreaterThan(0);
    expect(Streak::where('user_id', $user->id)->value('current_streak_days'))->toBe(1);

    $this->withHeaders(pasetoHeaders($user))
        ->getJson('/api/daily-claim')
        ->assertSuccessful()
        ->assertJsonPath('is_available', false)
        ->assertJsonPath('next_reset_at', Carbon::parse('2026-07-13 15:30:00')->toIso8601String());

    $this->withHeaders(pasetoHeaders($user))
        ->postJson('/api/daily-claim')
        ->assertConflict();
});

test('users can claim again after 24 hours from their last claim', function () {
    Carbon::setTestNow(Carbon::parse('2026-07-12 15:30:00'));

    $user = createUser(['total_points' => 0]);
    $this->seed([
        SeasonSeeder::class,
        StreakMilestoneSeeder::class,
    ]);

    $headers = pasetoHeaders($user);

    $this->withHeaders($headers)->postJson('/api/daily-claim')->assertCreated();

    Carbon::setTestNow(Carbon::parse('2026-07-13 15:30:00'));

    $this->withHeaders($headers)
        ->postJson('/api/daily-claim')
        ->assertCreated()
        ->assertJsonPath('streak_day', 2)
        ->assertJsonPath('next_reset_at', Carbon::parse('2026-07-14 15:30:00')->toIso8601String());

    expect(Streak::where('user_id', $user->id)->value('current_streak_days'))->toBe(2);
});

test('duplicate daily claims are blocked by idempotency', function () {
    $user = createUser(['total_points' => 0]);
    $this->seed([
        SeasonSeeder::class,
        StreakMilestoneSeeder::class,
    ]);

    $headers = pasetoHeaders($user);
    $payload = ['idempotency_key' => 'daily-claim-test-key'];

    $this->withHeaders($headers)->postJson('/api/daily-claim', $payload)->assertCreated();
    $this->withHeaders($headers)->postJson('/api/daily-claim', $payload)->assertConflict();
});

test('fan web claim awards once and keeps the daily claim page playable on retry', function () {
    Carbon::setTestNow(Carbon::parse('2026-07-12 15:30:00'));

    $user = connectRequiredSocialAccounts(createUser(['total_points' => 0]));
    $this->seed([
        SeasonSeeder::class,
        StreakMilestoneSeeder::class,
    ]);

    $this->actingAs($user)
        ->post(route('fan.daily-claim.store'))
        ->assertRedirect(route('fan.daily-claim'))
        ->assertSessionHas('success');

    $this->actingAs($user)
        ->get(route('fan.daily-claim'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/DailyClaim')
            ->where('is_available', false));

    // Second post must not blow up — page stays available for free play.
    $this->actingAs($user)
        ->from(route('fan.daily-claim'))
        ->post(route('fan.daily-claim.store'))
        ->assertRedirect(route('fan.daily-claim'))
        ->assertSessionHas('error');

    $this->actingAs($user)
        ->get(route('fan.daily-claim'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/DailyClaim')
            ->where('is_available', false));
});

afterEach(function () {
    Carbon::setTestNow();
});
