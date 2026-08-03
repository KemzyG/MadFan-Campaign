<?php

use App\Enums\StaffPosition;
use App\Models\ActivityLog;
use App\Models\User;
use App\Services\Admin\ImpersonationService;
use App\Support\ApplicationSettings;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;

beforeEach(function () {
    $this->withoutMiddleware(PreventRequestForgery::class);
    ApplicationSettings::sync(['social_verification_required' => 'false']);
});

test('super admin view as staff stays in admin console as that staff', function () {
    $super = createSuperAdminUser();
    $staff = User::factory()->staff(StaffPosition::Ambassador->value, $super)->create([
        'name' => 'View As Staff',
    ]);

    $this->actingAs($super)
        ->post(route('admin.impersonate', $staff))
        ->assertRedirect(route('admin.dashboard'));

    $this->assertAuthenticatedAs($staff);
    expect(session(ImpersonationService::SESSION_KEY))->toBe($super->id)
        ->and(session()->has(ImpersonationService::VIEW_AS_USER_KEY))->toBeFalse();

    $this->get(route('admin.dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('auth.user.id', $staff->id)
            ->where('impersonation.active', true)
            ->where('impersonation.mode', 'hard')
            ->where('impersonation.as.id', $staff->id)
            ->where('impersonation.impersonator.id', $super->id));

    expect(ActivityLog::query()->where('event', 'impersonation.started')->exists())->toBeTrue();
});

test('super admin can exit hard view as and return to admin', function () {
    $super = createSuperAdminUser();
    $staff = User::factory()->staff(StaffPosition::Support->value, $super)->create();

    $this->actingAs($super)
        ->post(route('admin.impersonate', $staff))
        ->assertRedirect();

    $this->post(route('impersonation.leave'))
        ->assertRedirect(route('admin.dashboard'));

    $this->assertAuthenticatedAs($super);
    expect(session()->has(ImpersonationService::SESSION_KEY))->toBeFalse();
    expect(ActivityLog::query()->where('event', 'impersonation.stopped')->exists())->toBeTrue();
});

test('super admin can hard view as inertia admin operator inside admin', function () {
    $super = createSuperAdminUser();
    $support = createSupportAdmin(['name' => 'Support Desk']);

    $this->actingAs($super)
        ->post(route('admin.impersonate', $support))
        ->assertRedirect(route('admin.dashboard'));

    $this->assertAuthenticatedAs($support);
    expect(session(ImpersonationService::SESSION_KEY))->toBe($super->id);

    $this->get(route('admin.dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('auth.user.id', $support->id)
            ->where('impersonation.active', true)
            ->where('impersonation.mode', 'hard'));
});

test('admin cannot start view as', function () {
    $admin = createAdminUser();
    $staff = User::factory()->staff(StaffPosition::Ambassador->value, $admin)->create();

    $this->actingAs($admin)
        ->post(route('admin.impersonate', $staff))
        ->assertForbidden();

    $this->assertAuthenticatedAs($admin);
});

test('super admin cannot view as another super admin', function () {
    $super = createSuperAdminUser();
    $other = createSuperAdminUser(['email' => 'other-super@madfan.test']);

    $this->actingAs($super)
        ->post(route('admin.impersonate', $other))
        ->assertForbidden();
});

test('super admin cannot view as regular fan without staff', function () {
    $super = createSuperAdminUser();
    $fan = createUser();

    $this->actingAs($super)
        ->post(route('admin.impersonate', $fan))
        ->assertForbidden();
});

test('staff show page exposes view as for super admin', function () {
    $super = createSuperAdminUser();
    $staff = User::factory()->staff(StaffPosition::Ambassador->value, $super)->create();

    $this->actingAs($super)
        ->get(route('admin.staff.show', $staff))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Staff/Show')
            ->where('can_impersonate', true));
});
