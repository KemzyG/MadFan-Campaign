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

test('proof images are stored on the private disk', function () {
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

    expect($progress?->proof_image_path)->not->toBeNull();

    Storage::disk(TaskProofStorage::DISK)->assertExists($progress->proof_image_path);
    Storage::disk(TaskProofStorage::LEGACY_DISK)->assertMissing($progress->proof_image_path);
});

test('owners can view their private proof images', function () {
    $user = createUser();
    $this->seed(TaskSeeder::class);
    $task = Task::query()->where('verification_required', true)->first();

    $path = 'task-proofs/'.$user->id.'/owner.jpg';
    Storage::disk(TaskProofStorage::DISK)->put(
        $path,
        (string) file_get_contents(base_path('tests/Fixtures/avatar.jpg')),
    );

    $progress = UserTaskProgress::query()->create([
        'user_id' => $user->id,
        'task_id' => $task->id,
        'status' => 'confirmed',
        'verification_status' => 'pending',
        'confirmed_at' => now(),
        'is_checked' => true,
        'proof_image_path' => $path,
    ]);

    $this->actingAs($user)
        ->get(route('task-proofs.show', $progress))
        ->assertSuccessful();
});

test('other fans cannot view private proof images', function () {
    $owner = createUser();
    $stranger = createUser();
    $this->seed(TaskSeeder::class);
    $task = Task::query()->where('verification_required', true)->first();

    $path = 'task-proofs/'.$owner->id.'/secret.jpg';
    Storage::disk(TaskProofStorage::DISK)->put(
        $path,
        (string) file_get_contents(base_path('tests/Fixtures/avatar.jpg')),
    );

    $progress = UserTaskProgress::query()->create([
        'user_id' => $owner->id,
        'task_id' => $task->id,
        'status' => 'confirmed',
        'verification_status' => 'pending',
        'confirmed_at' => now(),
        'is_checked' => true,
        'proof_image_path' => $path,
    ]);

    $this->actingAs($stranger)
        ->get(route('task-proofs.show', $progress))
        ->assertForbidden();
});

test('admins can view private proof images on the admin route', function () {
    $admin = createAdminUser();
    $user = createUser();
    $this->seed(TaskSeeder::class);
    $task = Task::query()->where('verification_required', true)->first();

    $path = 'task-proofs/'.$user->id.'/admin.jpg';
    Storage::disk(TaskProofStorage::DISK)->put(
        $path,
        (string) file_get_contents(base_path('tests/Fixtures/avatar.jpg')),
    );

    $progress = UserTaskProgress::query()->create([
        'user_id' => $user->id,
        'task_id' => $task->id,
        'status' => 'confirmed',
        'verification_status' => 'pending',
        'confirmed_at' => now(),
        'is_checked' => true,
        'proof_image_path' => $path,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.task-proofs.show', $progress))
        ->assertSuccessful();
});

test('guests cannot view private proof images', function () {
    $user = createUser();
    $this->seed(TaskSeeder::class);
    $task = Task::query()->where('verification_required', true)->first();

    $path = 'task-proofs/'.$user->id.'/guest.jpg';
    Storage::disk(TaskProofStorage::DISK)->put(
        $path,
        (string) file_get_contents(base_path('tests/Fixtures/avatar.jpg')),
    );

    $progress = UserTaskProgress::query()->create([
        'user_id' => $user->id,
        'task_id' => $task->id,
        'status' => 'confirmed',
        'verification_status' => 'pending',
        'confirmed_at' => now(),
        'is_checked' => true,
        'proof_image_path' => $path,
    ]);

    $this->get(route('task-proofs.show', $progress))
        ->assertRedirect();
});

test('legacy public-disk proofs remain readable through the gated route', function () {
    $user = createUser();
    $this->seed(TaskSeeder::class);
    $task = Task::query()->where('verification_required', true)->first();

    $path = 'task-proofs/'.$user->id.'/legacy.jpg';
    Storage::disk(TaskProofStorage::LEGACY_DISK)->put(
        $path,
        (string) file_get_contents(base_path('tests/Fixtures/avatar.jpg')),
    );

    $progress = UserTaskProgress::query()->create([
        'user_id' => $user->id,
        'task_id' => $task->id,
        'status' => 'confirmed',
        'verification_status' => 'pending',
        'confirmed_at' => now(),
        'is_checked' => true,
        'proof_image_path' => $path,
    ]);

    $this->actingAs($user)
        ->get(route('task-proofs.show', $progress))
        ->assertSuccessful();
});
