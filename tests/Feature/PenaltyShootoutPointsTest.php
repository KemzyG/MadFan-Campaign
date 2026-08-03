<?php

use App\Support\ApplicationSettings;
use Database\Seeders\SeasonSeeder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

test('fans earn server scored shootout points from zone', function () {
    ApplicationSettings::sync([
        'shootout_corner_bonus_enabled' => 'false',
        'shootout_min_seconds_between' => '0',
        'shootout_window_shots' => '15',
    ]);

    $user = connectRequiredSocialAccounts(createUser(['total_points' => 10]));
    $this->seed(SeasonSeeder::class);

    $this->actingAs($user)
        ->postJson(route('fan.daily-claim.shootout'), [
            'idempotency_key' => (string) Str::uuid(),
            'zone' => ['col' => 0, 'row' => 2],
        ])
        ->assertSuccessful()
        ->assertJsonPath('points_awarded', 1)
        ->assertJsonPath('new_total_points', 11)
        ->assertJsonPath('shootout.window_earned', 1)
        ->assertJsonPath('shootout.earned_today', 1);

    $user->refresh();
    expect($user->total_points)->toBe(11)
        ->and($user->shootout_window_earned)->toBe(1);
});

test('corner zones award three points when corner bonus is enabled', function () {
    ApplicationSettings::sync([
        'shootout_corner_bonus_enabled' => 'true',
        'shootout_min_seconds_between' => '0',
    ]);

    $user = connectRequiredSocialAccounts(createUser(['total_points' => 0]));
    $this->seed(SeasonSeeder::class);

    $this->actingAs($user)
        ->postJson(route('fan.daily-claim.shootout'), [
            'idempotency_key' => (string) Str::uuid(),
            'zone' => ['col' => 0, 'row' => 0],
        ])
        ->assertSuccessful()
        ->assertJsonPath('points_awarded', 3);

    $this->actingAs($user)
        ->postJson(route('fan.daily-claim.shootout'), [
            'idempotency_key' => (string) Str::uuid(),
            'zone' => ['col' => 1, 'row' => 1],
        ])
        ->assertSuccessful()
        ->assertJsonPath('points_awarded', 1);

    expect($user->fresh()->total_points)->toBe(4);
});

test('client points payload is ignored and zone is required', function () {
    ApplicationSettings::sync([
        'shootout_corner_bonus_enabled' => 'true',
        'shootout_min_seconds_between' => '0',
    ]);

    $user = connectRequiredSocialAccounts(createUser(['total_points' => 0]));
    $this->seed(SeasonSeeder::class);

    $this->actingAs($user)
        ->postJson(route('fan.daily-claim.shootout'), [
            'points' => 3,
            'idempotency_key' => (string) Str::uuid(),
            'zone' => ['col' => 1, 'row' => 1],
        ])
        ->assertSuccessful()
        ->assertJsonPath('points_awarded', 1);

    $this->actingAs($user)
        ->postJson(route('fan.daily-claim.shootout'), [
            'idempotency_key' => (string) Str::uuid(),
        ])
        ->assertStatus(422);
});

test('duplicate shootout idempotency keys do not double credit', function () {
    ApplicationSettings::sync([
        'shootout_min_seconds_between' => '0',
        'shootout_corner_bonus_enabled' => 'false',
    ]);

    $user = connectRequiredSocialAccounts(createUser(['total_points' => 0]));
    $this->seed(SeasonSeeder::class);
    $key = (string) Str::uuid();

    $this->actingAs($user)
        ->postJson(route('fan.daily-claim.shootout'), [
            'idempotency_key' => $key,
            'zone' => ['col' => 1, 'row' => 1],
        ])
        ->assertSuccessful()
        ->assertJsonPath('points_awarded', 1);

    $this->actingAs($user)
        ->postJson(route('fan.daily-claim.shootout'), [
            'idempotency_key' => $key,
            'zone' => ['col' => 1, 'row' => 1],
        ])
        ->assertSuccessful()
        ->assertJsonPath('points_awarded', 0)
        ->assertJsonPath('duplicate', true);

    expect($user->fresh()->total_points)->toBe(1);
});

test('filling the shootout shot window starts a one hour cooldown', function () {
    ApplicationSettings::sync([
        'shootout_window_shots' => '5',
        'shootout_cooldown_minutes' => '60',
        'shootout_min_seconds_between' => '0',
        'shootout_corner_bonus_enabled' => 'false',
    ]);

    $user = connectRequiredSocialAccounts(createUser(['total_points' => 0]));
    $user->forceFill(['shootout_window_earned' => 4])->save();
    $this->seed(SeasonSeeder::class);

    $this->actingAs($user)
        ->postJson(route('fan.daily-claim.shootout'), [
            'idempotency_key' => (string) Str::uuid(),
            'zone' => ['col' => 1, 'row' => 1],
        ])
        ->assertSuccessful()
        ->assertJsonPath('points_awarded', 1)
        ->assertJsonPath('cooldown', true)
        ->assertJsonPath('shootout.active', false)
        ->assertJsonPath('shootout.window_earned', 5);

    $user->refresh();

    expect($user->total_points)->toBe(1)
        ->and($user->shootout_window_earned)->toBe(5)
        ->and($user->shootout_cooldown_until)->not->toBeNull()
        ->and($user->shootout_cooldown_until->greaterThan(now()->addMinutes(59)))->toBeTrue();

    $this->actingAs($user)
        ->postJson(route('fan.daily-claim.shootout'), [
            'idempotency_key' => (string) Str::uuid(),
            'zone' => ['col' => 1, 'row' => 1],
        ])
        ->assertSuccessful()
        ->assertJsonPath('points_awarded', 0)
        ->assertJsonPath('cooldown', true);
});

test('award spacing rejects rapid fire farming', function () {
    ApplicationSettings::sync([
        'shootout_min_seconds_between' => '5',
        'shootout_corner_bonus_enabled' => 'false',
        'shootout_window_shots' => '15',
    ]);

    $user = connectRequiredSocialAccounts(createUser(['total_points' => 0]));
    $this->seed(SeasonSeeder::class);

    $this->actingAs($user)
        ->postJson(route('fan.daily-claim.shootout'), [
            'idempotency_key' => (string) Str::uuid(),
            'zone' => ['col' => 1, 'row' => 1],
        ])
        ->assertSuccessful()
        ->assertJsonPath('points_awarded', 1);

    $this->actingAs($user)
        ->postJson(route('fan.daily-claim.shootout'), [
            'idempotency_key' => (string) Str::uuid(),
            'zone' => ['col' => 1, 'row' => 1],
        ])
        ->assertSuccessful()
        ->assertJsonPath('points_awarded', 0)
        ->assertJsonPath('throttled', true);

    expect($user->fresh()->total_points)->toBe(1);
});

test('throttled responses still return fresh earned_today totals', function () {
    ApplicationSettings::sync([
        'shootout_min_seconds_between' => '5',
        'shootout_corner_bonus_enabled' => 'false',
        'shootout_window_shots' => '15',
    ]);

    $user = connectRequiredSocialAccounts(createUser(['total_points' => 0]));
    $this->seed(SeasonSeeder::class);

    $this->actingAs($user)
        ->postJson(route('fan.daily-claim.shootout'), [
            'idempotency_key' => (string) Str::uuid(),
            'zone' => ['col' => 1, 'row' => 1],
        ])
        ->assertSuccessful()
        ->assertJsonPath('points_awarded', 1)
        ->assertJsonPath('shootout.earned_today', 1);

    // Poison SWR cache with a stale lower total — mutation paths must not echo it.
    $cacheKey = 'shootout:earned_today:'.$user->id.':'.now()->toDateString();
    Cache::put($cacheKey, 0, 60);

    $this->actingAs($user)
        ->postJson(route('fan.daily-claim.shootout'), [
            'idempotency_key' => (string) Str::uuid(),
            'zone' => ['col' => 1, 'row' => 1],
        ])
        ->assertSuccessful()
        ->assertJsonPath('points_awarded', 0)
        ->assertJsonPath('throttled', true)
        ->assertJsonPath('shootout.earned_today', 1);
});

test('award responses ignore stale earned_today cache', function () {
    ApplicationSettings::sync([
        'shootout_min_seconds_between' => '0',
        'shootout_corner_bonus_enabled' => 'false',
        'shootout_window_shots' => '15',
    ]);

    $user = connectRequiredSocialAccounts(createUser(['total_points' => 0]));
    $this->seed(SeasonSeeder::class);

    $this->actingAs($user)
        ->postJson(route('fan.daily-claim.shootout'), [
            'idempotency_key' => (string) Str::uuid(),
            'zone' => ['col' => 1, 'row' => 1],
        ])
        ->assertSuccessful()
        ->assertJsonPath('shootout.earned_today', 1);

    $cacheKey = 'shootout:earned_today:'.$user->id.':'.now()->toDateString();
    Cache::put($cacheKey, 0, 60);

    $this->actingAs($user)
        ->postJson(route('fan.daily-claim.shootout'), [
            'idempotency_key' => (string) Str::uuid(),
            'zone' => ['col' => 0, 'row' => 1],
        ])
        ->assertSuccessful()
        ->assertJsonPath('points_awarded', 1)
        ->assertJsonPath('shootout.earned_today', 2);
});

test('shootout status includes wins and losses for the day', function () {
    ApplicationSettings::sync([
        'shootout_min_seconds_between' => '0',
        'shootout_corner_bonus_enabled' => 'false',
        'shootout_window_shots' => '15',
    ]);

    $user = connectRequiredSocialAccounts(createUser(['total_points' => 0]));
    $this->seed(SeasonSeeder::class);

    $this->actingAs($user)
        ->postJson(route('fan.daily-claim.shootout'), [
            'idempotency_key' => (string) Str::uuid(),
            'zone' => ['col' => 1, 'row' => 1],
        ])
        ->assertSuccessful()
        ->assertJsonPath('shootout.wins_today', 1)
        ->assertJsonPath('shootout.losses_today', 0);

    $this->actingAs($user)
        ->postJson(route('fan.daily-claim.shootout-loss'), [
            'result' => 'save',
        ])
        ->assertSuccessful()
        ->assertJsonPath('recorded', true)
        ->assertJsonPath('shootout.wins_today', 1)
        ->assertJsonPath('shootout.losses_today', 1);

    $this->actingAs($user)
        ->postJson(route('fan.daily-claim.shootout'), [
            'idempotency_key' => (string) Str::uuid(),
            'zone' => ['col' => 0, 'row' => 1],
        ])
        ->assertSuccessful()
        ->assertJsonPath('shootout.wins_today', 2)
        ->assertJsonPath('shootout.losses_today', 1);
});

test('expired shootout cooldown resets the shot window', function () {
    ApplicationSettings::sync([
        'shootout_window_shots' => '15',
        'shootout_cooldown_minutes' => '60',
        'shootout_min_seconds_between' => '0',
        'shootout_corner_bonus_enabled' => 'false',
    ]);

    $user = connectRequiredSocialAccounts(createUser(['total_points' => 20]));
    $user->forceFill([
        'shootout_window_earned' => 15,
        'shootout_cooldown_until' => now()->subMinute(),
    ])->save();
    $this->seed(SeasonSeeder::class);

    $this->actingAs($user)
        ->postJson(route('fan.daily-claim.shootout'), [
            'idempotency_key' => (string) Str::uuid(),
            'zone' => ['col' => 1, 'row' => 1],
        ])
        ->assertSuccessful()
        ->assertJsonPath('points_awarded', 1)
        ->assertJsonPath('cooldown', false)
        ->assertJsonPath('shootout.window_earned', 1);

    expect($user->fresh()->shootout_cooldown_until)->toBeNull();
});

test('bulk sync credits spaced awards and throttles those inside five seconds', function () {
    ApplicationSettings::sync([
        'shootout_min_seconds_between' => '5',
        'shootout_corner_bonus_enabled' => 'false',
        'shootout_window_shots' => '15',
    ]);

    $user = connectRequiredSocialAccounts(createUser(['total_points' => 0]));
    $this->seed(SeasonSeeder::class);

    $first = (string) Str::uuid();
    $tooClose = (string) Str::uuid();
    $spaced = (string) Str::uuid();
    $base = now()->subMinutes(2);

    $this->actingAs($user)
        ->postJson(route('fan.daily-claim.shootout-bulk'), [
            'awards' => [
                [
                    'idempotency_key' => $first,
                    'occurred_at' => $base->toIso8601String(),
                    'zone' => ['col' => 1, 'row' => 1],
                ],
                [
                    'idempotency_key' => $tooClose,
                    'occurred_at' => $base->copy()->addSeconds(2)->toIso8601String(),
                    'zone' => ['col' => 1, 'row' => 1],
                ],
                [
                    'idempotency_key' => $spaced,
                    'occurred_at' => $base->copy()->addSeconds(6)->toIso8601String(),
                    'zone' => ['col' => 0, 'row' => 1],
                ],
            ],
            'losses' => [
                [
                    'idempotency_key' => (string) Str::uuid(),
                    'occurred_at' => $base->copy()->addSeconds(1)->toIso8601String(),
                    'result' => 'save',
                ],
            ],
        ])
        ->assertSuccessful()
        ->assertJsonPath('points_awarded', 2)
        ->assertJsonPath('results.0.status', 'accepted')
        ->assertJsonPath('results.1.status', 'throttled')
        ->assertJsonPath('results.2.status', 'accepted')
        ->assertJsonPath('loss_results.0.status', 'accepted')
        ->assertJsonPath('shootout.wins_today', 2)
        ->assertJsonPath('shootout.losses_today', 1)
        ->assertJsonPath('shootout.earned_today', 2);

    expect($user->fresh()->total_points)->toBe(2);

    // Retrying the same bulk keys is safe — accepted become duplicates, points stay put.
    $this->actingAs($user)
        ->postJson(route('fan.daily-claim.shootout-bulk'), [
            'awards' => [
                [
                    'idempotency_key' => $first,
                    'occurred_at' => $base->toIso8601String(),
                    'zone' => ['col' => 1, 'row' => 1],
                ],
                [
                    'idempotency_key' => $spaced,
                    'occurred_at' => $base->copy()->addSeconds(6)->toIso8601String(),
                    'zone' => ['col' => 0, 'row' => 1],
                ],
            ],
        ])
        ->assertSuccessful()
        ->assertJsonPath('points_awarded', 0)
        ->assertJsonPath('results.0.status', 'duplicate')
        ->assertJsonPath('results.1.status', 'duplicate');

    expect($user->fresh()->total_points)->toBe(2);
});
