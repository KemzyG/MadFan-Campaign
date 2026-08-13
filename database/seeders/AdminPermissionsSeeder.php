<?php

namespace Database\Seeders;

use App\Enums\AdminPermission;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class AdminPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        foreach (AdminPermission::cases() as $permission) {
            Permission::firstOrCreate([
                'name' => $permission->value,
                'guard_name' => 'web',
            ]);
        }

        $allPermissions = AdminPermission::values();

        $rolePermissions = [
            'super-admin' => $allPermissions,
            'admin' => array_values(array_filter(
                $allPermissions,
                fn (string $permission): bool => ! in_array($permission, [
                    AdminPermission::RolesManage->value,
                    AdminPermission::SystemLogsClear->value,
                    AdminPermission::AdminsManage->value,
                ], true),
            )),
            'management' => [
                AdminPermission::DashboardView->value,
                AdminPermission::UsersView->value,
                AdminPermission::TasksManage->value,
                AdminPermission::SeasonsManage->value,
                AdminPermission::LoyaltyTiersManage->value,
                AdminPermission::LeaguesManage->value,
                AdminPermission::ClubsManage->value,
                AdminPermission::JerseysManage->value,
                AdminPermission::JerseyOrdersView->value,
                AdminPermission::JerseyOrdersManage->value,
                AdminPermission::ReferralsView->value,
                AdminPermission::PointTransactionsView->value,
            ],
            'support' => [
                AdminPermission::DashboardView->value,
                AdminPermission::UsersView->value,
                AdminPermission::TasksManage->value,
                AdminPermission::ReferralsView->value,
                AdminPermission::JerseyOrdersView->value,
            ],
        ];

        foreach ($rolePermissions as $roleName => $permissions) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->syncPermissions($permissions);
        }

        User::role(User::ADMIN_ROLES)->each(function (User $user): void {
            if ($user->roles->isEmpty()) {
                $user->assignRole('admin');
            }
        });
    }
}
