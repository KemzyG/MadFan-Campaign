<?php

use App\Enums\StaffPosition;
use App\Models\ActivityLog;
use App\Models\Season;
use App\Models\Task;
use App\Models\User;
use App\Models\UserTaskProgress;
use Database\Seeders\SeasonSeeder;

beforeEach(function () {
    $this->seed(SeasonSeeder::class);
});

function createTrackableStaffTask(array $attributes = []): Task
{
    $season = Season::query()->where('status', 'active')->first();

    return Task::query()->create([
        'season_id' => $season->id,
        'code' => 'STAFF_'.strtoupper(fake()->unique()->bothify('??###')),
        'name' => 'Staff Task',
        'description' => 'Assigned staff responsibility',
        'points' => 50,
        'platform' => 'internal',
        'task_type' => 'staff_ops',
        'audience' => 'staff',
        'is_active' => true,
        'display_order' => 1,
        ...$attributes,
    ]);
}

test('super admin can track staff assignment progress and activity timeline', function () {
    seedRoles();
    $super = createSuperAdminUser();
    $staff = User::factory()->staff(StaffPosition::Ambassador->value, $super)->create();

    $directTask = createTrackableStaffTask([
        'code' => 'STAFF_TRACK_DIRECT',
        'name' => 'Track Direct',
        'assigned_user_id' => $staff->id,
        'display_order' => 1,
    ]);
    $positionTask = createTrackableStaffTask([
        'code' => 'STAFF_TRACK_POS',
        'name' => 'Track Position',
        'staff_position' => StaffPosition::Ambassador->value,
        'display_order' => 2,
    ]);

    UserTaskProgress::query()->create([
        'user_id' => $staff->id,
        'task_id' => $directTask->id,
        'season_id' => $directTask->season_id,
        'status' => 'confirmed',
        'verification_status' => 'verified',
        'confirmed_at' => now()->subHour(),
        'verified_at' => now()->subMinutes(45),
        'points_awarded' => 0,
    ]);

    UserTaskProgress::query()->create([
        'user_id' => $staff->id,
        'task_id' => $positionTask->id,
        'season_id' => $positionTask->season_id,
        'status' => 'claimed',
        'verification_status' => 'not_required',
        'confirmed_at' => now()->subMinutes(30),
        'claimed_at' => now()->subMinutes(20),
        'points_awarded' => 50,
    ]);

    $this->actingAs($super)
        ->get("/ops/staff/{$staff->id}")
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Staff/Show')
            ->has('tracked_assignments', 2)
            ->where('tracked_assignments.0.code', $directTask->code)
            ->where('tracked_assignments.0.status', 'confirmed')
            ->where('tracked_assignments.0.assignment_type', 'direct')
            ->where('tracked_assignments.1.code', $positionTask->code)
            ->where('tracked_assignments.1.status', 'claimed')
            ->has('activity_timeline')
            ->where('activity_timeline.0.event', 'staff.task_claimed'));
});

test('assigning a staff task logs an activity for the assignee', function () {
    $admin = createAdminUser();
    $staff = User::factory()->staff(StaffPosition::Support->value, $admin)->create();
    $season = Season::query()->where('status', 'active')->first();

    $this->actingAs($admin)
        ->postJson('/ops/api/tasks', [
            'season_id' => $season->id,
            'code' => 'STAFF_ASSIGN_LOG',
            'name' => 'Logged Assignment',
            'description' => 'Track assignment events',
            'points' => 40,
            'platform' => 'internal',
            'task_type' => 'staff_ops',
            'audience' => 'staff',
            'assigned_user_id' => $staff->id,
            'is_active' => true,
        ])
        ->assertCreated();

    expect(
        ActivityLog::query()
            ->where('event', 'task.staff_assigned')
            ->where('properties->assigned_user_id', $staff->id)
            ->exists()
    )->toBeTrue();

    $this->actingAs($admin)
        ->getJson("/ops/api/users/{$staff->id}/staff-performance")
        ->assertSuccessful()
        ->assertJsonPath('tracked_assignments.0.code', 'STAFF_ASSIGN_LOG')
        ->assertJsonStructure([
            'tracked_assignments',
            'activity_timeline',
            'performance',
        ]);
});
