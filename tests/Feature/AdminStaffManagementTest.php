<?php

use App\Enums\StaffPosition;
use App\Models\User;
use Database\Seeders\SeasonSeeder;
use Database\Seeders\StaffPositionSeeder;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;

beforeEach(function () {
    $this->seed(SeasonSeeder::class);
    $this->withoutMiddleware(PreventRequestForgery::class);
});

test('admin can access inertia staff pages', function (string $path, string $component) {
    $admin = createAdminUser();
    $this->seed(StaffPositionSeeder::class);
    $staff = User::query()->where('email', 'staff@madfan.test')->firstOrFail();

    $resolvedPath = str_replace('{user}', (string) $staff->id, $path);

    $this->actingAs($admin)
        ->get($resolvedPath)
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component($component));
})->with([
    ['/app/staff', 'Admin/Staff/Index'],
    ['/app/staff/{user}', 'Admin/Staff/Show'],
]);

test('admin can list staff members via api', function () {
    $admin = createAdminUser();
    $this->seed(StaffPositionSeeder::class);

    $response = $this->actingAs($admin)
        ->getJson('/app/api/staff')
        ->assertSuccessful();

    $emails = collect($response->json('data'))->pluck('email');

    expect($emails)->toContain('staff@madfan.test', 'support@madfan.test');
});

test('admin can create update and delete staff members via api', function () {
    $admin = createAdminUser();
    $user = createUser();

    $this->actingAs($admin)
        ->postJson('/app/api/staff', [
            'user_id' => $user->id,
            'staff_position' => StaffPosition::Support->value,
            'staff_status' => 'active',
        ])
        ->assertCreated()
        ->assertJsonPath('staff_profile.position', StaffPosition::Support->value);

    $this->actingAs($admin)
        ->putJson("/app/api/staff/{$user->id}", [
            'staff_position' => StaffPosition::CommunityManager->value,
            'staff_status' => 'active',
        ])
        ->assertSuccessful()
        ->assertJsonPath('staff_profile.position', StaffPosition::CommunityManager->value);

    $this->actingAs($admin)
        ->deleteJson("/app/api/staff/{$user->id}")
        ->assertSuccessful();

    $user->refresh();

    expect($user->is_staff)->toBeFalse();
});

test('admin cannot create duplicate staff member', function () {
    $admin = createAdminUser();
    $staff = User::factory()->staff(StaffPosition::Ambassador->value, $admin)->create();

    $this->actingAs($admin)
        ->postJson('/app/api/staff', [
            'user_id' => $staff->id,
            'staff_position' => StaffPosition::Ambassador->value,
            'staff_status' => 'active',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['user_id']);
});

test('staff detail api includes performance and tasks', function () {
    $admin = createAdminUser();
    $this->seed(StaffPositionSeeder::class);
    $staff = User::query()->where('email', 'staff@madfan.test')->firstOrFail();

    $this->actingAs($admin)
        ->getJson("/app/api/staff/{$staff->id}")
        ->assertSuccessful()
        ->assertJsonStructure([
            'user',
            'staff_profile',
            'performance' => [
                'total_points',
                'performance_score',
                'staff_rank',
            ],
            'assigned_tasks',
            'position_tasks',
            'leaderboard',
        ]);
});
