<?php

use App\Models\Task;
use App\Models\UserTaskProgress;
use App\Support\ApplicationSettings;
use App\Support\TaskProofStorage;
use Database\Seeders\SeasonSeeder;
use Database\Seeders\TaskSeeder;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(SeasonSeeder::class);
    ApplicationSettings::sync([
        'task_social_verification_enabled' => 'false',
        'social_verification_required' => 'false',
    ]);
    Storage::fake(TaskProofStorage::DISK);
    Storage::fake(TaskProofStorage::LEGACY_DISK);
});

test('manual review tasks require a proof url or screenshot', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    $user = createUser(['handle' => '@proofuser']);
    $this->seed(TaskSeeder::class);
    $task = Task::query()->where('verification_required', true)->first();

    $this->actingAs($user)
        ->post("/tasks/{$task->id}/complete", ['_token' => csrf_token()])
        ->assertInvalid(['proof_url']);
});

test('fans can submit a social proof url for manual review', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    $user = createUser(['handle' => '@proofuser', 'total_points' => 0]);
    $this->seed(TaskSeeder::class);
    $task = Task::query()->where('verification_required', true)->first();

    $this->actingAs($user)
        ->post("/tasks/{$task->id}/complete", [
            '_token' => csrf_token(),
            'proof_url' => 'https://x.com/proofuser',
        ])
        ->assertRedirect(route('fan.tasks'));

    $progress = UserTaskProgress::query()
        ->where('user_id', $user->id)
        ->where('task_id', $task->id)
        ->first();

    expect($progress)->not->toBeNull()
        ->and($progress->status)->toBe('confirmed')
        ->and($progress->verification_status)->toBe('pending')
        ->and($progress->proof_url)->toBe('https://x.com/proofuser')
        ->and($progress->hasProof())->toBeTrue();
});

test('fans can submit a proof screenshot instead of a url', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    $user = createUser(['total_points' => 0]);
    $this->seed(TaskSeeder::class);
    $task = Task::query()->where('verification_required', true)->first();
    $image = UploadedFile::fake()->createWithContent(
        'follow-proof.jpg',
        (string) file_get_contents(base_path('tests/Fixtures/avatar.jpg')),
    );

    $this->actingAs($user)
        ->post("/tasks/{$task->id}/complete", [
            '_token' => csrf_token(),
            'proof_image' => $image,
        ])
        ->assertRedirect(route('fan.tasks'));

    $progress = UserTaskProgress::query()
        ->where('user_id', $user->id)
        ->where('task_id', $task->id)
        ->first();

    expect($progress)->not->toBeNull()
        ->and($progress->proof_image_path)->not->toBeNull()
        ->and($progress->proof_image_url)->not->toBeNull()
        ->and($progress->hasProof())->toBeTrue();

    Storage::disk(TaskProofStorage::DISK)->assertExists($progress->proof_image_path);
});

test('share tasks accept either a post url or screenshot', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    $user = connectRequiredSocialAccounts(createUser(['total_points' => 0]));
    $this->seed(TaskSeeder::class);
    $task = Task::query()->where('code', 'TASK_SHARE_SOCIAL')->first();
    expect($task)->not->toBeNull();

    $image = UploadedFile::fake()->createWithContent(
        'share.jpg',
        (string) file_get_contents(base_path('tests/Fixtures/avatar.jpg')),
    );

    $this->actingAs($user)
        ->post("/tasks/{$task->id}/complete", [
            '_token' => csrf_token(),
            'proof_image' => $image,
        ])
        ->assertRedirect(route('fan.tasks'));

    expect(UserTaskProgress::query()
        ->where('user_id', $user->id)
        ->where('task_id', $task->id)
        ->value('proof_image_path'))->not->toBeNull();
});

test('admin review payload includes proof image url', function () {
    $admin = createAdminUser();
    $user = createUser();
    $this->seed(TaskSeeder::class);
    $task = Task::query()->where('verification_required', true)->first();

    $path = 'task-proofs/'.$user->id.'/admin-view.jpg';
    Storage::disk(TaskProofStorage::DISK)->put(
        $path,
        (string) file_get_contents(base_path('tests/Fixtures/avatar.jpg')),
    );

    UserTaskProgress::query()->create([
        'user_id' => $user->id,
        'task_id' => $task->id,
        'status' => 'confirmed',
        'verification_status' => 'pending',
        'confirmed_at' => now(),
        'is_checked' => true,
        'proof_url' => 'https://x.com/example/status/1',
        'proof_image_path' => $path,
    ]);

    $this->actingAs($admin)
        ->get('/app/task-reviews')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/TaskReviews/Index')
            ->where('reviews.data.0.has_proof', true)
            ->where('reviews.data.0.proof_url', 'https://x.com/example/status/1')
            ->missing('reviews.data.0.proof_image_path')
            ->has('reviews.data.0.proof_image_url'));
});
