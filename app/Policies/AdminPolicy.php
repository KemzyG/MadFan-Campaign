<?php

namespace App\Policies;

use App\Enums\AdminPermission;
use App\Models\User;

class AdminPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(AdminPermission::AdminsView->value);
    }

    public function view(User $user, User $admin): bool
    {
        return $user->can(AdminPermission::AdminsView->value);
    }

    public function create(User $user): bool
    {
        return $user->can(AdminPermission::AdminsManage->value);
    }

    public function update(User $user, User $admin): bool
    {
        return $user->can(AdminPermission::AdminsManage->value);
    }

    public function delete(User $user, User $admin): bool
    {
        return $user->can(AdminPermission::AdminsManage->value);
    }
}
