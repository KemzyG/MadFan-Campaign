<?php

use App\Models\SocialAccount;
use App\Models\Task;
use App\Models\TaskStep;
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

test('task review page includes task context social accounts and evidence for admins', function () {
    $admin = createAdminUser();
    $user = createUser([
        'name' => 'Evidence Fan',
        'handle' => 'evidencefan',
    ]);

    SocialAccount::query()->create([
        'user_id' => $user->id,
        'platform' => 'x',
        'platform_user_id' => '12345',
        'username' => 'evidencefan',
        'display_name' => 'Evidence Fan',
        'connected_at' => now(),
        'verified_at' => now(),
    ]);

    $this->seed(TaskSeeder::class);

    $task = Task::query()->where('verification_required', true)->first();
    expect($task)->not->toBeNull();

    $task->forceFill([
        'description' => 'Follow the official MadFan account on X.',
        'external_url' => 'https://x.com/madfan',
    ])->save();

    TaskStep::query()->updateOrCreate(
        ['task_id' => $task->id, 'step_number' => 1],
        [
            'description' => 'Open the MadFan profile',
            'link_url' => 'https://x.com/madfan',
            'link_label' => 'Open profile',
        ],
    );

    UserTaskProgress::query()->create([
        'user_id' => $user->id,
        'task_id' => $task->id,
        'status' => 'confirmed',
        'verification_status' => 'pending',
        'confirmed_at' => now(),
        'is_checked' => true,
        'external_handle' => 'evidencefan',
        'external_post_id' => 'post-99',
        'proof_url' => 'https://x.com/evidencefan/status/99',
    ]);

    $this->actingAs($admin)
        ->get('/app/task-reviews')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/TaskReviews/Index')
            ->has('reviews.data', 1)
            ->where('reviews.data.0.awaiting_review', true)
            ->where('reviews.data.0.external_handle', 'evidencefan')
            ->where('reviews.data.0.external_post_id', 'post-99')
            ->where('reviews.data.0.proof_url', 'https://x.com/evidencefan/status/99')
            ->where('reviews.data.0.task.description', 'Follow the official MadFan account on X.')
            ->where('reviews.data.0.task.external_url', 'https://x.com/madfan')
            ->where('reviews.data.0.task.steps.0.description', 'Open the MadFan profile')
            ->where('reviews.data.0.user.social_accounts.0.username', 'evidencefan')
            ->where('reviews.data.0.user.social_accounts.0.platform', 'x'));
});

test('api task reviews expose review detail fields', function () {
    $admin = createAdminUser();
    $user = createUser();
    $this->seed(TaskSeeder::class);
    $task = Task::query()->where('verification_required', true)->first();

    UserTaskProgress::query()->create([
        'user_id' => $user->id,
        'task_id' => $task->id,
        'status' => 'confirmed',
        'verification_status' => 'pending',
        'confirmed_at' => now(),
        'is_checked' => true,
        'proof_url' => 'https://x.com/example/status/1',
    ]);

    $this->actingAs($admin)
        ->getJson('/app/api/task-reviews')
        ->assertSuccessful()
        ->assertJsonPath('data.0.awaiting_review', true)
        ->assertJsonPath('data.0.proof_url', 'https://x.com/example/status/1')
        ->assertJsonStructure([
            'data' => [[
                'id',
                'awaiting_review',
                'proof_url',
                'task' => ['id', 'name', 'description', 'external_url', 'steps'],
                'user' => ['id', 'name', 'social_accounts'],
            ]],
        ]);
});

test('cannot approve submissions that are not awaiting review', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    $admin = createAdminUser();
    $user = createUser();
    $this->seed(TaskSeeder::class);
    $task = Task::query()->where('verification_required', true)->first();

    $progress = UserTaskProgress::query()->create([
        'user_id' => $user->id,
        'task_id' => $task->id,
        'status' => 'rejected',
        'verification_status' => 'failed',
        'confirmed_at' => now(),
        'failed_at' => now(),
        'failure_reason' => 'Already rejected',
        'is_checked' => true,
    ]);

    $this->actingAs($admin)
        ->from('/app/task-reviews')
        ->post("/app/task-reviews/{$progress->id}/approve", ['_token' => csrf_token()])
        ->assertRedirect('/app/task-reviews')
        ->assertSessionHasErrors('progress');
});
