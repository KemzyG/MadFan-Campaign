<?php

use App\Models\AdminOrganization;
use App\Models\Referral;
use App\Models\Task;
use App\Models\UserTaskProgress;
use App\Support\ApplicationSettings;
use App\Support\TaskProofStorage;
use Database\Seeders\SeasonSeeder;
use Database\Seeders\TaskSeeder;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(SeasonSeeder::class);
    ApplicationSettings::sync([
        'task_social_verification_enabled' => 'false',
        'social_verification_required' => 'false',
    ]);
    Storage::fake(TaskProofStorage::DISK);
});

test('org admin cannot approve task reviews for fans outside their partition', function () {
    $this->withoutMiddleware(PreventRequestForgery::class);

    $organization = AdminOrganization::factory()->countries(['Spain'])->create();
    $orgAdmin = createOrgAdmin($organization, 'admin');
    $hiddenFan = createUser(['country' => 'England']);
    $this->seed(TaskSeeder::class);
    $task = Task::query()->where('verification_required', true)->first();

    $progress = UserTaskProgress::query()->create([
        'user_id' => $hiddenFan->id,
        'task_id' => $task->id,
        'status' => 'confirmed',
        'verification_status' => 'pending',
        'confirmed_at' => now(),
        'is_checked' => true,
    ]);

    $this->actingAs($orgAdmin)
        ->post("/ops/task-reviews/{$progress->id}/approve", ['_token' => csrf_token()])
        ->assertForbidden();
});

test('api task reviews only list fans inside the admin organization partition', function () {
    $organization = AdminOrganization::factory()->countries(['Spain'])->create();
    $orgAdmin = createOrgAdmin($organization, 'admin');
    $visibleFan = createUser(['country' => 'Spain']);
    $hiddenFan = createUser(['country' => 'England']);
    $this->seed(TaskSeeder::class);
    $task = Task::query()->where('verification_required', true)->first();

    foreach ([$visibleFan, $hiddenFan] as $fan) {
        UserTaskProgress::query()->create([
            'user_id' => $fan->id,
            'task_id' => $task->id,
            'status' => 'confirmed',
            'verification_status' => 'pending',
            'confirmed_at' => now(),
            'is_checked' => true,
        ]);
    }

    $this->actingAs($orgAdmin)
        ->getJson('/ops/api/task-reviews')
        ->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.user.id', $visibleFan->id);
});

test('org admin cannot view proof images for fans outside their partition', function () {
    $organization = AdminOrganization::factory()->countries(['Spain'])->create();
    $orgAdmin = createOrgAdmin($organization, 'admin');
    $hiddenFan = createUser(['country' => 'England']);
    $this->seed(TaskSeeder::class);
    $task = Task::query()->where('verification_required', true)->first();

    $path = 'task-proofs/'.$hiddenFan->id.'/secret.jpg';
    Storage::disk(TaskProofStorage::DISK)->put(
        $path,
        (string) file_get_contents(base_path('tests/Fixtures/avatar.jpg')),
    );

    $progress = UserTaskProgress::query()->create([
        'user_id' => $hiddenFan->id,
        'task_id' => $task->id,
        'status' => 'confirmed',
        'verification_status' => 'pending',
        'confirmed_at' => now(),
        'is_checked' => true,
        'proof_image_path' => $path,
    ]);

    $this->actingAs($orgAdmin)
        ->get(route('admin.task-proofs.show', $progress))
        ->assertForbidden();
});

test('org admin cannot update referral status for referrers outside their partition', function () {
    $organization = AdminOrganization::factory()->countries(['Spain'])->create();
    $orgAdmin = createOrgAdmin($organization, 'admin');
    $hiddenReferrer = createUser(['country' => 'England']);
    $referred = createUser(['country' => 'England']);

    $referral = Referral::factory()->pending()->create([
        'referrer_user_id' => $hiddenReferrer->id,
        'referred_user_id' => $referred->id,
    ]);

    $this->actingAs($orgAdmin)
        ->patchJson("/ops/api/referrals/{$referral->id}/status", ['status' => 'rejected'])
        ->assertForbidden();
});
