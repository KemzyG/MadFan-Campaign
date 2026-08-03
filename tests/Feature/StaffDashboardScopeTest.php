<?php

use App\Enums\AdminPermission;
use App\Enums\StaffPosition;
use App\Enums\StaffStatus;
use App\Services\Staff\StaffAssignmentService;

beforeEach(function () {
    seedRoles();
});

test('admin and super admin see platform dashboard analytics', function () {
    $admin = createAdminUser();
    $super = createSuperAdminUser();

    expect($admin->can(AdminPermission::DashboardPlatform->value))->toBeTrue()
        ->and($super->can(AdminPermission::DashboardPlatform->value))->toBeTrue();

    $this->actingAs($admin)
        ->get('/app')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->where('dashboard_mode', 'platform')
            ->has('stats.total_users')
            ->has('top_users'));

    $this->actingAs($super)
        ->get('/app')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->where('dashboard_mode', 'platform'));
});

test('support sees personal performance dashboard not platform analytics', function () {
    $support = createSupportAdmin();

    expect($support->can(AdminPermission::DashboardPlatform->value))->toBeFalse()
        ->and($support->can(AdminPermission::TasksManage->value))->toBeTrue()
        ->and($support->can(AdminPermission::StaffView->value))->toBeFalse();

    $this->actingAs($support)
        ->get('/app')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->where('dashboard_mode', 'personal')
            ->has('stats.performance_score')
            ->has('performance')
            ->missing('stats.total_users'));

    $this->actingAs($support)
        ->get('/app/staff')
        ->assertForbidden();

    $this->actingAs($support)
        ->get('/app/tasks')
        ->assertSuccessful();
});

test('ambassador dashboard is personal performance only', function () {
    $admin = createAdminUser();
    $ambassador = createUser(['name' => 'Amb Desk', 'total_points' => 500, 'referral_count' => 4]);

    app(StaffAssignmentService::class)->assign(
        $ambassador,
        StaffPosition::Ambassador,
        $admin,
        StaffStatus::Active,
    );

    $ambassador = $ambassador->fresh();

    expect($ambassador->can(AdminPermission::DashboardView->value))->toBeTrue()
        ->and($ambassador->can(AdminPermission::DashboardPlatform->value))->toBeFalse()
        ->and($ambassador->can(AdminPermission::StaffView->value))->toBeFalse()
        ->and($ambassador->can(AdminPermission::UsersView->value))->toBeFalse();

    $this->actingAs($ambassador)
        ->get('/app')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('dashboard_mode', 'personal')
            ->where('stats.total_points', 500)
            ->where('stats.total_referrals', 4)
            ->where('staff_profile.position', StaffPosition::Ambassador->value));

    $this->actingAs($ambassador)
        ->get('/app/staff')
        ->assertForbidden();

    $this->actingAs($ambassador)
        ->get('/app/users')
        ->assertForbidden();
});

test('management can manage tasks but not staff directory', function () {
    seedRoles();
    $management = createUser();
    $management->syncRoles(['management']);
    $management = $management->fresh();

    expect($management->can(AdminPermission::TasksManage->value))->toBeTrue()
        ->and($management->can(AdminPermission::StaffView->value))->toBeFalse()
        ->and($management->can(AdminPermission::DashboardPlatform->value))->toBeFalse();

    $this->actingAs($management)
        ->get('/app/tasks')
        ->assertSuccessful();

    $this->actingAs($management)
        ->get('/app/staff')
        ->assertForbidden();

    $this->actingAs($management)
        ->get('/app')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->where('dashboard_mode', 'personal'));
});
