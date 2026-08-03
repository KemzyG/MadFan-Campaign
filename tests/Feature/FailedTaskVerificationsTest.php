<?php

use App\Models\Task;
use App\Models\User;
use App\Models\UserTaskProgress;
use Database\Seeders\SeasonSeeder;
use Database\Seeders\TaskSeeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    $this->seed(SeasonSeeder::class);
});

test('support admin can view task reviews page', function () {
    $support = createSupportAdmin();

    $this->actingAs($support)
        ->get('/app/task-reviews')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('Admin/TaskReviews/Index'));
});

test('failed verifications path redirects to rejected task reviews', function () {
    $support = createSupportAdmin();

    $this->actingAs($support)
        ->get('/app/failed-verifications')
        ->assertRedirect('/app/task-reviews?status=rejected');
});

test('task reviews api lists pending submissions by default', function () {
    $admin = createAdminUser();
    $user = createUser(['name' => 'Pending Fan', 'email' => 'pending@example.com']);
    $this->seed(TaskSeeder::class);

    $task = Task::query()->where('code', 'TASK_FOLLOW_X')->first();
    expect($task)->not->toBeNull();

    UserTaskProgress::query()->create([
        'user_id' => $user->id,
        'task_id' => $task->id,
        'status' => 'confirmed',
        'verification_status' => 'pending',
        'external_handle' => '@pendingfan',
        'confirmed_at' => now(),
        'is_checked' => true,
    ]);

    $otherTask = Task::query()->where('code', 'TASK_COMMENT_POSTS')->first();
    expect($otherTask)->not->toBeNull();

    UserTaskProgress::query()->create([
        'user_id' => $user->id,
        'task_id' => $otherTask->id,
        'status' => 'claimed',
        'verification_status' => 'verified',
        'verified_at' => now(),
    ]);

    $response = $this->actingAs($admin)
        ->getJson('/app/api/task-reviews')
        ->assertSuccessful();

    expect($response->json('data'))->toHaveCount(1)
        ->and($response->json('data.0.user.email'))->toBe('pending@example.com')
        ->and($response->json('data.0.task.code'))->toBe('TASK_FOLLOW_X');
});

test('admin without users.view permission cannot access task reviews api', function () {
    seedRoles();
    $admin = User::factory()->admin()->create();
    $admin->syncRoles(['admin']);
    Permission::findByName('users.view', 'web')?->delete();

    app()[PermissionRegistrar::class]->forgetCachedPermissions();

    $this->actingAs($admin)
        ->getJson('/app/api/task-reviews')
        ->assertForbidden();
});

test('task reviews can be filtered by platform', function () {
    $admin = createAdminUser();
    $user = createUser();
    $this->seed(TaskSeeder::class);

    $xTask = Task::query()->where('platform', 'x')->first();
    $discordTask = Task::query()->where('platform', 'discord')->first();

    expect($xTask)->not->toBeNull()
        ->and($discordTask)->not->toBeNull();

    UserTaskProgress::query()->create([
        'user_id' => $user->id,
        'task_id' => $xTask->id,
        'status' => 'confirmed',
        'verification_status' => 'pending',
        'confirmed_at' => now(),
    ]);

    UserTaskProgress::query()->create([
        'user_id' => $user->id,
        'task_id' => $discordTask->id,
        'status' => 'confirmed',
        'verification_status' => 'pending',
        'confirmed_at' => now(),
    ]);

    $this->actingAs($admin)
        ->getJson('/app/api/task-reviews?platform=discord')
        ->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.task.code', $discordTask->code);
});
