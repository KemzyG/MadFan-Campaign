<?php

namespace App\Filament\Concerns;

use App\Enums\AdminPermission;
use App\Models\User;
use Filament\Facades\Filament;
use Illuminate\Auth\Access\Response;

trait AuthorizesFilamentResources
{
    protected static function filamentUser(): ?User
    {
        $user = Filament::auth()->user() ?? auth()->user();

        return $user instanceof User ? $user : null;
    }

    protected static function adminCan(AdminPermission $permission): bool
    {
        $user = static::filamentUser();

        if ($user === null) {
            return false;
        }

        if ($user->hasRole('super-admin')) {
            return true;
        }

        return $user->can($permission->value);
    }

    protected static function adminAuthorizationResponse(AdminPermission $permission): Response
    {
        return static::adminCan($permission)
            ? Response::allow()
            : Response::deny();
    }
}
