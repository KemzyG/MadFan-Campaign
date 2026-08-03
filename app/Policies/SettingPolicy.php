<?php

namespace App\Policies;

use App\Enums\AdminPermission;
use App\Models\Setting;
use App\Models\User;

class SettingPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(AdminPermission::SettingsView->value);
    }

    public function view(User $user, Setting $setting): bool
    {
        return $user->can(AdminPermission::SettingsView->value);
    }

    public function update(User $user, Setting $setting): bool
    {
        return $user->can(AdminPermission::SettingsUpdate->value);
    }
}
