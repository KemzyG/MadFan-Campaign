<?php

namespace App\Policies;

use App\Enums\AdminPermission;
use App\Models\User;
use App\Models\UserTaskProgress;
use App\Services\Admin\AdminOrganizationContext;

class UserTaskProgressPolicy
{
    public function viewProof(User $user, UserTaskProgress $progress): bool
    {
        if ($user->id === $progress->user_id) {
            return true;
        }

        if (! $user->can(AdminPermission::UsersView->value)) {
            return false;
        }

        $fan = $progress->user;

        return $fan instanceof User
            && app(AdminOrganizationContext::class)->fanIsVisible($fan);
    }
}
