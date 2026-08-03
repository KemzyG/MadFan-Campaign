<?php

use App\Models\Task;
use App\Models\UserTaskProgress;
use Database\Seeders\SeasonSeeder;
use Database\Seeders\TaskSeeder;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;

test('users can list active tasks', function () {
    $user = createUser();
    $this->seed([
        SeasonSeeder::class,
        TaskSeeder::class,
    ]);

    $this->withHeaders(pasetoHeaders($user))
        ->getJson('/api/tasks')
        ->assertSuccessful()
        ->assertJsonStructure(['tasks', 'weekly_progress']);
});

test('users can confirm and claim a non-verified task', function () {
    $user = createUser(['total_points' => 0]);
    $this->seed([
        SeasonSeeder::class,
        TaskSeeder::class,
    ]);

    $task = Task::where('code', 'TASK_COMMENT_POSTS')->first();
    expect($task)->not->toBeNull();

    $headers = pasetoHeaders($user);

    $this->withHeaders($headers)
        ->postJson("/api/tasks/{$task->id}/confirm")
        ->assertSuccessful();

    $this->withHeaders($headers)
        ->postJson("/api/tasks/{$task->id}/claim")
        ->assertSuccessful()
        ->assertJsonPath('points_awarded', $task->points);

    expect(UserTaskProgress::where('user_id', $user->id)->where('task_id', $task->id)->value('status'))
        ->toBe('claimed');
});

test('users can confirm a verification task for manual review', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    $user = createUser(['handle' => '@testfan', 'total_points' => 0]);
    $this->seed([
        SeasonSeeder::class,
        TaskSeeder::class,
    ]);

    $task = Task::query()->where('verification_required', true)->first();
    expect($task)->not->toBeNull();

    $this->actingAs($user)
        ->post("/tasks/{$task->id}/confirm", [
            '_token' => csrf_token(),
            'proof_url' => 'https://x.com/testfan',
        ])
        ->assertRedirect(route('fan.tasks'));

    $progress = UserTaskProgress::query()
        ->where('user_id', $user->id)
        ->where('task_id', $task->id)
        ->first();

    expect($progress)->not->toBeNull()
        ->and($progress->status)->toBe('confirmed')
        ->and($progress->verification_status)->toBe('pending');
});

test('users can complete a non-verified task in one step via web route', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    $user = connectRequiredSocialAccounts(createUser(['total_points' => 0]));
    $this->seed([
        SeasonSeeder::class,
        TaskSeeder::class,
    ]);

    $task = Task::where('code', 'TASK_COMMENT_POSTS')->first();
    expect($task)->not->toBeNull();

    $this->actingAs($user)
        ->post("/tasks/{$task->id}/complete", [
            '_token' => csrf_token(),
        ])
        ->assertRedirect(route('fan.tasks'));

    expect(UserTaskProgress::where('user_id', $user->id)->where('task_id', $task->id)->value('status'))
        ->toBe('claimed');
});

test('share tasks require a proof url before completing', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    $user = connectRequiredSocialAccounts(createUser(['total_points' => 0]));
    $this->seed([
        SeasonSeeder::class,
        TaskSeeder::class,
    ]);

    $task = Task::where('code', 'TASK_SHARE_SOCIAL')->first();
    expect($task)->not->toBeNull();

    $this->actingAs($user)
        ->post("/tasks/{$task->id}/complete", [
            '_token' => csrf_token(),
        ])
        ->assertInvalid(['proof_url']);
});

test('task resource exposes completion rules', function () {
    $user = createUser();
    $this->seed([
        SeasonSeeder::class,
        TaskSeeder::class,
    ]);

    $response = $this->withHeaders(pasetoHeaders($user))
        ->getJson('/api/tasks')
        ->assertSuccessful();

    $shareTask = collect($response->json('tasks'))->firstWhere('task_type', 'share');
    $followTask = collect($response->json('tasks'))->firstWhere('code', 'TASK_FOLLOW_X');

    expect($shareTask['completion_rules']['requires_proof'])->toBeTrue()
        ->and($shareTask['completion_rules']['requires_proof_url'])->toBeTrue()
        ->and($followTask['completion_rules']['requires_proof'])->toBeTrue()
        ->and($followTask['completion_rules']['manual_review'])->toBeTrue()
        ->and($followTask['completion_rules']['requires_social_connection'])->toBeFalse()
        ->and($followTask['completion_rules']['confirm_label'])->toContain('followed');
});
