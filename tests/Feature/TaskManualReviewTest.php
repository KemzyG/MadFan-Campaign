<?php

use App\Models\Task;
use App\Models\UserTaskProgress;
use App\Support\ApplicationSettings;
use Database\Seeders\SeasonSeeder;
use Database\Seeders\TaskSeeder;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;

beforeEach(function () {
    $this->seed(SeasonSeeder::class);
    ApplicationSettings::sync([
        'task_social_verification_enabled' => 'false',
        'social_verification_required' => 'false',
    ]);
});

test('verification required tasks submit for admin review instead of auto verifying', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    $user = createUser(['total_points' => 0]);
    $this->seed(TaskSeeder::class);

    $task = Task::query()->where('verification_required', true)->first();
    expect($task)->not->toBeNull();

    $this->actingAs($user)
        ->post("/tasks/{$task->id}/complete", ['_token' => csrf_token(), 'proof_url' => 'https://x.com/reviewfan'])
        ->assertRedirect(route('fan.tasks'));

    $progress = UserTaskProgress::query()
        ->where('user_id', $user->id)
        ->where('task_id', $task->id)
        ->first();

    expect($progress)->not->toBeNull()
        ->and($progress->status)->toBe('confirmed')
        ->and($progress->verification_status)->toBe('pending')
        ->and($user->fresh()->total_points)->toBe(0);
});

test('support admin can view and approve pending task reviews', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    $support = createSupportAdmin();
    $user = createUser(['total_points' => 5, 'name' => 'Review Fan']);
    $this->seed(TaskSeeder::class);

    $task = Task::query()->where('verification_required', true)->first();
    expect($task)->not->toBeNull();

    $progress = UserTaskProgress::query()->create([
        'user_id' => $user->id,
        'task_id' => $task->id,
        'status' => 'confirmed',
        'verification_status' => 'pending',
        'confirmed_at' => now(),
        'is_checked' => true,
        'proof_url' => 'https://x.com/example/status/1',
    ]);

    $this->actingAs($support)
        ->get('/ops/task-reviews')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/TaskReviews/Index')
            ->has('reviews.data', 1));

    $this->actingAs($support)
        ->post("/ops/task-reviews/{$progress->id}/approve", ['_token' => csrf_token()])
        ->assertRedirect();

    $progress->refresh();

    expect($progress->status)->toBe('claimed')
        ->and($progress->verification_status)->toBe('verified')
        ->and($user->fresh()->total_points)->toBe(5 + $task->points);
});

test('admins can reject pending task reviews with a reason', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    $admin = createAdminUser();
    $user = createUser();
    $this->seed(TaskSeeder::class);

    $task = Task::query()->where('verification_required', true)->first();
    $progress = UserTaskProgress::query()->create([
        'user_id' => $user->id,
        'task_id' => $task->id,
        'status' => 'confirmed',
        'verification_status' => 'pending',
        'confirmed_at' => now(),
        'is_checked' => true,
    ]);

    $this->actingAs($admin)
        ->post("/ops/task-reviews/{$progress->id}/reject", [
            '_token' => csrf_token(),
            'reason' => 'Could not verify the follow.',
        ])
        ->assertRedirect();

    $progress->refresh();

    expect($progress->status)->toBe('rejected')
        ->and($progress->verification_status)->toBe('failed')
        ->and($progress->failure_reason)->toBe('Could not verify the follow.');
});

test('regular users cannot access task reviews', function () {
    $user = createUser();

    $this->actingAs($user)
        ->get('/ops/task-reviews')
        ->assertForbidden();
});
