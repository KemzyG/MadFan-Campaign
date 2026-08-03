<?php

namespace App\Policies;

use App\Enums\AdminPermission;
use App\Models\User;

class SystemLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(AdminPermission::SystemLogsView->value);
    }

    public function clear(User $user): bool
    {
        return $user->can(AdminPermission::SystemLogsClear->value);
    }
}
