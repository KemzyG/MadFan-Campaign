<?php

namespace App\Policies;

use App\Enums\AdminPermission;
use App\Models\User;
use App\Services\Admin\AdminOrganizationContext;

class UserPolicy
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
        return $user->can(AdminPermission::UsersView->value);
    }

    public function view(User $user, User $model): bool
    {
        if (! $user->can(AdminPermission::UsersView->value)) {
            return false;
        }

        return app(AdminOrganizationContext::class)->fanIsVisible($model);
    }

    public function create(User $user): bool
    {
        return $user->can(AdminPermission::UsersCreate->value);
    }

    public function update(User $user, User $model): bool
    {
        if (! $user->can(AdminPermission::UsersUpdate->value)) {
            return false;
        }

        return app(AdminOrganizationContext::class)->fanIsVisible($model);
    }

    public function delete(User $user, User $model): bool
    {
        if (! $user->can(AdminPermission::UsersDelete->value)) {
            return false;
        }

        return app(AdminOrganizationContext::class)->fanIsVisible($model);
    }

    public function assignRole(User $user, User $model): bool
    {
        if (! $user->can(AdminPermission::UsersAssignRole->value)) {
            return false;
        }

        return app(AdminOrganizationContext::class)->fanIsVisible($model);
    }

    public function viewAnyStaff(User $user): bool
    {
        return $user->can(AdminPermission::StaffView->value);
    }

    public function manageStaff(User $user, User $model): bool
    {
        return $user->can(AdminPermission::StaffManage->value);
    }
}
