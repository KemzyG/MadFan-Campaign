<?php

namespace App\Policies;

use App\Enums\AdminPermission;
use App\Models\Role;
use App\Models\User;

class RolePolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('super-admin')) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return $user->can(AdminPermission::RolesView->value);
    }

    public function view(User $user, Role $role): bool
    {
        return $user->can(AdminPermission::RolesView->value);
    }

    public function create(User $user): bool
    {
        return $user->can(AdminPermission::RolesManage->value);
    }

    public function update(User $user, Role $role): bool
    {
        return $user->can(AdminPermission::RolesManage->value);
    }

    public function delete(User $user, Role $role): bool
    {
        return $user->can(AdminPermission::RolesManage->value);
    }
}
