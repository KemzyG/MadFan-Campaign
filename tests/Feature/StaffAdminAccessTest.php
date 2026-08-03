<?php

use App\Enums\AdminPermission;
use App\Enums\StaffPosition;
use App\Enums\StaffStatus;
use App\Models\User;
use App\Services\Admin\ImpersonationService;
use App\Services\Staff\StaffAssignmentService;
use App\Support\ApplicationSettings;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;

beforeEach(function () {
    $this->withoutMiddleware(PreventRequestForgery::class);
    ApplicationSettings::sync(['social_verification_required' => 'false']);
});

test('active staff can access inertia admin with assigned permissions', function () {
    seedRoles();
    $admin = createAdminUser();
    $staff = createUser(['email' => 'ambassador-console@madfan.test']);

    app(StaffAssignmentService::class)->assign(
        $staff,
        StaffPosition::Ambassador,
        $admin,
        StaffStatus::Active,
    );

    $staff = $staff->fresh();

    expect($staff->canAccessInertiaAdmin())->toBeTrue()
        ->and($staff->can(AdminPermission::DashboardView->value))->toBeTrue()
        ->and($staff->can(AdminPermission::DashboardPlatform->value))->toBeFalse()
        ->and($staff->can(AdminPermission::UsersView->value))->toBeFalse();

    $this->actingAs($staff)
        ->get('/app')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->where('dashboard_mode', 'personal')
            ->where('auth.user.id', $staff->id)
            ->where('workspace.key', 'ambassador'));

    $this->actingAs($staff)
        ->get('/app/users')
        ->assertForbidden();

    $this->actingAs($staff)
        ->get('/app/settings')
        ->assertForbidden();
});

test('staff login backfills missing console permissions', function () {
    seedRoles();
    $admin = createAdminUser();
    $staff = createUser(['email' => 'support-heal@madfan.test']);

    // Simulate legacy staff row without Spatie permissions.
    $staff->forceFill([
        'is_staff' => true,
        'staff_position' => StaffPosition::Support->value,
        'staff_status' => StaffStatus::Active->value,
        'staff_position_assigned_at' => now(),
        'staff_position_assigned_by' => $admin->id,
    ])->save();
    $staff->syncPermissions([]);

    expect($staff->fresh()->canAccessInertiaAdmin())->toBeFalse();

    $this->post('/app/login', [
        'email' => 'support-heal@madfan.test',
        'password' => validTestPassword(),
        '_token' => csrf_token(),
    ])->assertRedirect('/app');

    expect($staff->fresh()->canAccessInertiaAdmin())->toBeTrue()
        ->and($staff->fresh()->can(AdminPermission::DashboardView->value))->toBeTrue();
});

test('inactive staff lose admin console access', function () {
    seedRoles();
    $admin = createAdminUser();
    $staff = createUser();
    $service = app(StaffAssignmentService::class);
    $service->assign($staff, StaffPosition::Ambassador, $admin);
    $service->setStatus($staff->fresh(), StaffStatus::Inactive, $admin);

    $staff = $staff->fresh();

    expect($staff->canAccessInertiaAdmin())->toBeFalse()
        ->and($staff->can(AdminPermission::DashboardView->value))->toBeFalse();

    $this->actingAs($staff)
        ->get('/app')
        ->assertForbidden();
});

test('removing staff revokes admin console permissions', function () {
    seedRoles();
    $admin = createAdminUser();
    $staff = createUser();
    $service = app(StaffAssignmentService::class);
    $service->assign($staff, StaffPosition::CommunityManager, $admin);
    $service->remove($staff->fresh(), $admin);

    $staff = $staff->fresh();

    expect($staff->is_staff)->toBeFalse()
        ->and($staff->canAccessInertiaAdmin())->toBeFalse()
        ->and($staff->getAllPermissions())->toHaveCount(0);
});

test('super admin view as staff logs into admin console as that staff', function () {
    seedRoles();
    $super = createSuperAdminUser();
    $staff = User::factory()->staff(StaffPosition::Ambassador->value, $super)->create();

    $this->actingAs($super)
        ->post(route('admin.impersonate', $staff))
        ->assertRedirect(route('admin.dashboard'));

    $this->assertAuthenticatedAs($staff);
    expect(session(ImpersonationService::SESSION_KEY))->toBe($super->id);
});
