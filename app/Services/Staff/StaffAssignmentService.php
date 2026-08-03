<?php

namespace App\Services\Staff;

use App\Enums\StaffPosition;
use App\Enums\StaffStatus;
use App\Models\ActivityLog;
use App\Models\User;
use App\Support\StaffPositionPermissions;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StaffAssignmentService
{
    public function assign(User $user, StaffPosition $position, User $assignedBy, ?StaffStatus $status = null): User
    {
        if ($user->hasAnyRole(User::ADMIN_ROLES) && $position !== StaffPosition::Admin) {
            throw ValidationException::withMessages([
                'staff_position' => 'Existing admin accounts should keep the Admin staff position when promoted.',
            ]);
        }

        return DB::transaction(function () use ($user, $position, $assignedBy, $status): User {
            $resolvedStatus = $status ?? StaffStatus::Active;

            $user->forceFill([
                'is_staff' => true,
                'staff_position' => $position->value,
                'staff_position_assigned_at' => now(),
                'staff_position_assigned_by' => $assignedBy->id,
                'staff_status' => $resolvedStatus->value,
            ])->save();

            $this->syncConsolePermissions($user, $position, $resolvedStatus);

            ActivityLog::record(
                'staff.position_assigned',
                "Assigned {$position->label()} staff position to {$user->email}",
                $assignedBy->id,
                [
                    'user_id' => $user->id,
                    'staff_position' => $position->value,
                    'staff_status' => $resolvedStatus->value,
                ],
            );

            return $user->fresh(['staffPositionAssignedBy']);
        });
    }

    public function updatePosition(User $user, StaffPosition $position, User $updatedBy): User
    {
        if (! $user->is_staff) {
            return $this->assign($user, $position, $updatedBy);
        }

        return DB::transaction(function () use ($user, $position, $updatedBy): User {
            $previous = $user->staff_position;

            $user->forceFill([
                'staff_position' => $position->value,
                'staff_position_assigned_at' => now(),
                'staff_position_assigned_by' => $updatedBy->id,
                'staff_status' => StaffStatus::Active->value,
            ])->save();

            $this->syncConsolePermissions($user, $position, StaffStatus::Active);

            ActivityLog::record(
                'staff.position_updated',
                "Changed staff position for {$user->email} from {$previous} to {$position->value}",
                $updatedBy->id,
                [
                    'user_id' => $user->id,
                    'previous_position' => $previous,
                    'staff_position' => $position->value,
                ],
            );

            return $user->fresh(['staffPositionAssignedBy']);
        });
    }

    public function setStatus(User $user, StaffStatus $status, User $updatedBy): User
    {
        if (! $user->is_staff) {
            throw ValidationException::withMessages([
                'staff_status' => 'This user does not have a staff position.',
            ]);
        }

        $user->forceFill(['staff_status' => $status->value])->save();

        $position = StaffPosition::tryFrom((string) $user->staff_position);
        if ($position !== null) {
            $this->syncConsolePermissions($user, $position, $status);
        }

        ActivityLog::record(
            'staff.status_updated',
            "Set staff status for {$user->email} to {$status->value}",
            $updatedBy->id,
            ['user_id' => $user->id, 'staff_status' => $status->value],
        );

        return $user->fresh(['staffPositionAssignedBy']);
    }

    public function remove(User $user, User $removedBy): User
    {
        if (! $user->is_staff) {
            return $user;
        }

        return DB::transaction(function () use ($user, $removedBy): User {
            $previousPosition = $user->staff_position;

            $user->forceFill([
                'is_staff' => false,
                'staff_position' => null,
                'staff_position_assigned_at' => null,
                'staff_position_assigned_by' => null,
                'staff_status' => null,
            ])->save();

            $this->revokeConsolePermissions($user);

            ActivityLog::record(
                'staff.position_removed',
                "Removed {$previousPosition} staff position from {$user->email}",
                $removedBy->id,
                ['user_id' => $user->id, 'previous_position' => $previousPosition],
            );

            return $user->fresh();
        });
    }

    public function isActiveStaff(User $user): bool
    {
        return $user->is_staff
            && $user->staff_status === StaffStatus::Active->value
            && filled($user->staff_position);
    }

    /**
     * @return array<string, mixed>
     */
    public function profileForUser(User $user): array
    {
        $position = StaffPosition::tryFrom((string) $user->staff_position);

        return [
            'is_staff' => $this->isActiveStaff($user),
            'position' => $position?->value,
            'position_label' => $position?->label(),
            'position_description' => $position?->description(),
            'assigned_at' => $user->staff_position_assigned_at?->toIso8601String(),
            'status' => $user->staff_status,
            'status_label' => StaffStatus::tryFrom((string) $user->staff_status)?->label(),
            'assigned_by' => $user->staffPositionAssignedBy ? [
                'id' => $user->staffPositionAssignedBy->id,
                'name' => $user->staffPositionAssignedBy->name,
                'email' => $user->staffPositionAssignedBy->email,
            ] : null,
        ];
    }

    public function syncConsolePermissions(User $user, StaffPosition $position, StaffStatus $status): void
    {
        if ($user->hasAnyRole(User::ADMIN_ROLES)) {
            return;
        }

        if ($status !== StaffStatus::Active) {
            $this->revokeConsolePermissions($user);

            return;
        }

        $user->syncPermissions(StaffPositionPermissions::for($position));
    }

    public function revokeConsolePermissions(User $user): void
    {
        if ($user->hasAnyRole(User::ADMIN_ROLES)) {
            return;
        }

        $user->syncPermissions([]);
    }
}
