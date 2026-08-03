<?php

use App\Models\AdminOrganization;
use App\Models\DailyClaim;
use App\Models\PointTransaction;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;

test('admin user profile serializes last login as an ISO date', function () {
    $admin = createAdminUser();
    $lastLoginAt = now()->subHour()->startOfSecond();
    $fan = createUser(['last_login_at' => $lastLoginAt]);

    $this->actingAs($admin)
        ->get("/app/users/{$fan->id}")
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Show')
            ->where('profile.last_login_at', $lastLoginAt->toIso8601String()));
});

test('admin can view fan profile with analytics', function () {
    $admin = createAdminUser();
    $fan = createUser([
        'name' => 'Profile Fan',
        'total_points' => 420,
        'current_streak_days' => 3,
        'referral_count' => 2,
    ]);

    PointTransaction::query()->create([
        'user_id' => $fan->id,
        'season_id' => null,
        'source_type' => 'daily_claim',
        'source_id' => now()->toDateString(),
        'amount' => 25,
        'balance_after' => 25,
        'reason' => 'Daily claim',
        'idempotency_key' => 'profile-tx-1',
    ]);

    DailyClaim::query()->create([
        'user_id' => $fan->id,
        'claim_date' => today(),
        'status' => 'claimed',
        'base_points' => 25,
        'multiplier' => 1,
        'points_earned' => 25,
        'streak_day_number' => 1,
        'claimed_at' => now(),
    ]);

    $this->actingAs($admin)
        ->get("/app/users/{$fan->id}")
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Show')
            ->where('profile.id', $fan->id)
            ->where('profile.name', 'Profile Fan')
            ->where('can_edit', true)
            ->where('analytics.stats.total_points', 420)
            ->where('analytics.stats.referral_count', 2)
            ->where('analytics.stats.daily_claims_total', 1)
            ->has('analytics.recent_transactions', 1)
            ->has('analytics.recent_claims', 1)
            ->has('analytics.points_by_source', 1));
});

test('super admin can update fan profile from inertia', function () {
    $super = createSuperAdminUser();
    $fan = createUser(['name' => 'Before', 'club' => 'Old Club']);

    $this->withoutMiddleware(PreventRequestForgery::class);

    $this->actingAs($super)
        ->put("/app/users/{$fan->id}", [
            'name' => 'After Name',
            'email' => $fan->email,
            'club' => 'Liverpool FC',
            'total_points' => 900,
        ])
        ->assertRedirect(route('admin.users.show', $fan))
        ->assertSessionHas('success');

    expect($fan->fresh()->name)->toBe('After Name')
        ->and($fan->fresh()->club)->toBe('Liverpool FC')
        ->and($fan->fresh()->total_points)->toBe(900);
});

test('admin can update fan profile from inertia', function () {
    $admin = createAdminUser();
    $fan = createUser(['name' => 'Admin Edit Before']);

    $this->withoutMiddleware(PreventRequestForgery::class);

    $this->actingAs($admin)
        ->put("/app/users/{$fan->id}", [
            'name' => 'Admin Edit After',
            'email' => $fan->email,
            'country' => 'Spain',
        ])
        ->assertRedirect(route('admin.users.show', $fan));

    expect($fan->fresh()->name)->toBe('Admin Edit After')
        ->and($fan->fresh()->country)->toBe('Spain');
});

test('support can view but cannot update fan profile', function () {
    $support = createSupportAdmin();
    $fan = createUser(['name' => 'Locked Fan']);

    $this->actingAs($support)
        ->get("/app/users/{$fan->id}")
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Show')
            ->where('can_edit', false));

    $this->withoutMiddleware(PreventRequestForgery::class);

    $this->actingAs($support)
        ->put("/app/users/{$fan->id}", [
            'name' => 'Hacked',
            'email' => $fan->email,
        ])
        ->assertForbidden();

    expect($fan->fresh()->name)->toBe('Locked Fan');
});

test('org admin cannot view fan outside partition', function () {
    $organization = AdminOrganization::factory()->countries(['Spain'])->create();
    $orgAdmin = createOrgAdmin($organization, 'admin');
    $hiddenFan = createUser(['country' => 'England', 'name' => 'Hidden Fan']);

    $this->actingAs($orgAdmin)
        ->get("/app/users/{$hiddenFan->id}")
        ->assertForbidden();
});

test('users index includes create and delete flags for admin', function () {
    $admin = createAdminUser();

    $this->actingAs($admin)
        ->get('/app/users')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Index')
            ->where('can_create', true)
            ->where('can_delete', true));
});
