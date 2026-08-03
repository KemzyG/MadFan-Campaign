<?php

use App\Enums\AdminPermission;
use App\Filament\Resources\Admins\AdminResource;
use App\Models\User;
use Database\Seeders\AdminPermissionsSeeder;
use Filament\Facades\Filament;
use Illuminate\Support\Facades\Gate;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    Filament::setCurrentPanel(Filament::getPanel('admin'));
    $this->seed(AdminPermissionsSeeder::class);
});

test('super-admin can create edit and delete admins in filament even without users permissions', function () {
    $superAdmin = User::factory()->create();
    $superAdmin->syncRoles(['super-admin']);

    // Strip user CRUD permissions so UserPolicy alone would deny; super-admin must still pass.
    $superAdminRole = Role::findByName('super-admin', 'web');
    $superAdminRole->revokePermissionTo([
        AdminPermission::UsersCreate->value,
        AdminPermission::UsersUpdate->value,
        AdminPermission::UsersDelete->value,
    ]);
    $superAdmin->refresh();
    app()[PermissionRegistrar::class]->forgetCachedPermissions();

    $this->actingAs($superAdmin);
    Filament::auth()->login($superAdmin);

    $target = User::factory()->create();
    $target->assignRole('admin');

    expect(AdminResource::canViewAny())->toBeTrue()
        ->and(AdminResource::canCreate())->toBeTrue()
        ->and(AdminResource::canEdit($target))->toBeTrue()
        ->and(AdminResource::canDelete($target))->toBeTrue()
        ->and(AdminResource::getCreateAuthorizationResponse()->allowed())->toBeTrue()
        ->and(AdminResource::getEditAuthorizationResponse($target)->allowed())->toBeTrue()
        ->and(AdminResource::getDeleteAuthorizationResponse($target)->allowed())->toBeTrue()
        ->and(AdminResource::getDeleteAnyAuthorizationResponse()->allowed())->toBeTrue();
});

test('regular admin cannot manage admins even with users.create', function () {
    $admin = User::factory()->create();
    $admin->syncRoles(['admin']);

    expect($admin->can(AdminPermission::UsersCreate->value))->toBeTrue()
        ->and($admin->can(AdminPermission::AdminsManage->value))->toBeFalse();

    $this->actingAs($admin);
    Filament::auth()->login($admin);

    $target = User::factory()->create();
    $target->assignRole('support');

    expect(AdminResource::canViewAny())->toBeTrue()
        ->and(AdminResource::canCreate())->toBeFalse()
        ->and(AdminResource::getCreateAuthorizationResponse()->allowed())->toBeFalse()
        ->and(AdminResource::getEditAuthorizationResponse($target)->allowed())->toBeFalse()
        ->and(AdminResource::getDeleteAuthorizationResponse($target)->allowed())->toBeFalse();
});

test('gate before allows super-admin every filament ability', function () {
    $superAdmin = User::factory()->create();
    $superAdmin->syncRoles(['super-admin']);

    expect(Gate::forUser($superAdmin)->allows('create', User::class))->toBeTrue()
        ->and(Gate::forUser($superAdmin)->allows('update', $superAdmin))->toBeTrue()
        ->and(Gate::forUser($superAdmin)->allows('delete', $superAdmin))->toBeTrue()
        ->and(Gate::forUser($superAdmin)->allows(AdminPermission::AdminsManage->value))->toBeTrue();
});

test('admin with only admins.manage can use admin resource actions', function () {
    Permission::findOrCreate(AdminPermission::AdminsView->value, 'web');
    Permission::findOrCreate(AdminPermission::AdminsManage->value, 'web');
    Permission::findOrCreate(AdminPermission::DashboardView->value, 'web');

    $user = User::factory()->create();
    $user->syncRoles([]);
    $user->givePermissionTo([
        AdminPermission::DashboardView->value,
        AdminPermission::AdminsView->value,
        AdminPermission::AdminsManage->value,
    ]);

    $this->actingAs($user);
    Filament::auth()->login($user);

    $target = User::factory()->create();
    $target->assignRole('support');

    expect(AdminResource::getCreateAuthorizationResponse()->allowed())->toBeTrue()
        ->and(AdminResource::getEditAuthorizationResponse($target)->allowed())->toBeTrue()
        ->and(AdminResource::getDeleteAuthorizationResponse($target)->allowed())->toBeTrue()
        ->and(Gate::forUser($user)->denies('create', User::class))->toBeTrue();
});
