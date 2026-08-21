<?php

namespace App\Policies;

use App\Enums\AdminPermission;
use App\Models\MediaAsset;
use App\Models\User;

class MediaAssetPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(AdminPermission::MediaManage->value)
            || $user->can(AdminPermission::JerseysManage->value);
    }

    public function view(User $user, MediaAsset $mediaAsset): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->can(AdminPermission::MediaManage->value);
    }

    public function update(User $user, MediaAsset $mediaAsset): bool
    {
        return $user->can(AdminPermission::MediaManage->value);
    }

    public function delete(User $user, MediaAsset $mediaAsset): bool
    {
        return $user->can(AdminPermission::MediaManage->value);
    }
}
