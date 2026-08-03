<?php

use App\Enums\AdminPermission;
use App\Support\MaskedEmail;
use Database\Seeders\SeasonSeeder;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;

test('masked email keeps first and last local characters', function () {
    expect(MaskedEmail::from('mikeu@gmail.com'))->toBe('m***u@gmail.com')
        ->and(MaskedEmail::from('ab@example.com'))->toBe('a***b@example.com')
        ->and(MaskedEmail::from('a@example.com'))->toBe('a***@example.com');
});

test('activity logs are admin and super admin only', function () {
    seedRoles();

    $admin = createAdminUser();
    $super = createSuperAdminUser();
    $support = createSupportAdmin();

    expect($admin->can(AdminPermission::ActivityLogsView->value))->toBeTrue()
        ->and($super->can(AdminPermission::ActivityLogsView->value))->toBeTrue()
        ->and($support->can(AdminPermission::ActivityLogsView->value))->toBeFalse();

    $this->actingAs($admin)->get('/app/activity-logs')->assertSuccessful();
    $this->actingAs($super)->get('/app/activity-logs')->assertSuccessful();
    $this->actingAs($support)->get('/app/activity-logs')->assertForbidden();
});

test('support can view user profiles but cannot create update or delete', function () {
    seedRoles();
    $support = createSupportAdmin();
    $fan = createUser(['name' => 'Viewable Fan', 'total_points' => 120]);

    expect($support->can(AdminPermission::UsersView->value))->toBeTrue()
        ->and($support->can(AdminPermission::UsersCreate->value))->toBeFalse()
        ->and($support->can(AdminPermission::UsersUpdate->value))->toBeFalse()
        ->and($support->can(AdminPermission::UsersDelete->value))->toBeFalse();

    $this->actingAs($support)
        ->get('/app/users')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Index')
            ->where('can_create', false)
            ->where('can_delete', false)
            ->has('users.data'));

    $this->actingAs($support)
        ->get("/app/users/{$fan->id}")
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Show')
            ->where('can_edit', false)
            ->where('can_delete', false)
            ->has('analytics.stats'));

    $this->withoutMiddleware(PreventRequestForgery::class);

    $this->actingAs($support)
        ->put("/app/users/{$fan->id}", [
            'name' => 'Hacked',
            'email' => $fan->email,
        ])
        ->assertForbidden();
});

test('only admin and super admin can create and delete users', function () {
    seedRoles();
    $admin = createAdminUser();
    $super = createSuperAdminUser();
    $management = createUser();
    $management->syncRoles(['management']);
    $management = $management->fresh();

    expect($admin->can(AdminPermission::UsersCreate->value))->toBeTrue()
        ->and($admin->can(AdminPermission::UsersDelete->value))->toBeTrue()
        ->and($super->can(AdminPermission::UsersCreate->value))->toBeTrue()
        ->and($management->can(AdminPermission::UsersCreate->value))->toBeFalse()
        ->and($management->can(AdminPermission::UsersDelete->value))->toBeFalse();

    $this->actingAs($admin)
        ->get('/app/users')
        ->assertInertia(fn ($page) => $page
            ->where('can_create', true)
            ->where('can_delete', true));
});

test('campaign leaderboard exposes masked emails', function () {
    $this->seed(SeasonSeeder::class);

    $leader = createUser([
        'total_points' => 9000,
        'email' => 'mikeu@gmail.com',
        'name' => 'Leader Fan',
    ]);
    createUser(['total_points' => 100]);

    $this->get('/')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Campaign')
            ->where('leaderboard.0.user.email_masked', 'm***u@gmail.com')
            ->where('leaderboard.0.user.id', $leader->id));
});

test('campaign leaderboard excludes admin accounts', function () {
    $this->seed(SeasonSeeder::class);

    createAdminUser(['total_points' => 50000, 'email' => 'board-admin@madfan.test']);
    $fan = createUser(['total_points' => 200, 'email' => 'board-fan@madfan.test']);

    $this->get('/')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Campaign')
            ->where('leaderboard.0.user.id', $fan->id));
});
