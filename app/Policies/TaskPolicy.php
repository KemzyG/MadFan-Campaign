<?php

namespace App\Policies;

use App\Enums\AdminPermission;
use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(AdminPermission::TasksManage->value);
    }

    public function view(User $user, Task $task): bool
    {
        return $user->can(AdminPermission::TasksManage->value);
    }

    public function create(User $user): bool
    {
        return $user->can(AdminPermission::TasksManage->value);
    }

    public function update(User $user, Task $task): bool
    {
        return $user->can(AdminPermission::TasksManage->value);
    }

    public function delete(User $user, Task $task): bool
    {
        return $user->can(AdminPermission::TasksManage->value);
    }
}
