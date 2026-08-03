<?php

namespace App\Policies;

use App\Enums\AdminPermission;
use App\Models\User;

class StaffMemberPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(AdminPermission::StaffView->value);
    }

    public function view(User $user, User $staffMember): bool
    {
        return $user->can(AdminPermission::StaffView->value);
    }

    public function create(User $user): bool
    {
        return $user->can(AdminPermission::StaffManage->value);
    }

    public function update(User $user, User $staffMember): bool
    {
        return $user->can(AdminPermission::StaffManage->value);
    }

    public function delete(User $user, User $staffMember): bool
    {
        return $user->can(AdminPermission::StaffManage->value);
    }
}
