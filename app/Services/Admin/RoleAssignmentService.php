<?php

namespace App\Services\Admin;

use App\Models\User;
use Illuminate\Validation\ValidationException;

class RoleAssignmentService
{
    /**
     * @var list<string>
     */
    public const INERTIA_ADMIN_ROLES = ['admin', 'management', 'support'];

    public function assertCanAssignRole(User $actor, string $roleName): void
    {
        if (! in_array($roleName, self::INERTIA_ADMIN_ROLES, true) && $roleName !== 'super-admin') {
            throw ValidationException::withMessages([
                'role' => 'Invalid role selected.',
            ]);
        }

        if ($roleName === 'super-admin' && ! $actor->hasRole('super-admin')) {
            throw ValidationException::withMessages([
                'role' => 'Only super-admins can assign the super-admin role.',
            ]);
        }

        if (! $actor->hasAnyRole(['super-admin', 'admin'])) {
            throw ValidationException::withMessages([
                'role' => 'You do not have permission to assign roles.',
            ]);
        }
    }

    public function assignRole(User $actor, User $target, string $roleName): User
    {
        $this->assertCanAssignRole($actor, $roleName);

        $target->syncRoles([$roleName]);

        return $target->fresh(['roles']);
    }
}
