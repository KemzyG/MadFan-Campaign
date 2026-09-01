<?php

use App\Enums\StaffPosition;
use App\Models\ActivityLog;
use App\Models\Season;
use App\Models\Task;
use App\Models\User;
use Database\Seeders\SeasonSeeder;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;

beforeEach(function () {
    $this->seed(SeasonSeeder::class);
    $this->withoutMiddleware(PreventRequestForgery::class);
});

function createStaffUser(string $position = 'ambassador', ?User $assignedBy = null, array $attributes = []): User
{
    seedRoles();

    return User::factory()->staff($position, $assignedBy)->create($attributes);
}

function createStaffTask(array $attributes = []): Task
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

function createFanTask(array $attributes = []): Task
{
    $season = Season::query()->where('status', 'active')->first();

    return Task::query()->create([
        'season_id' => $season->id,
        'code' => 'FAN_'.strtoupper(fake()->unique()->bothify('??###')),
        'name' => 'Fan Task',
        'description' => 'Fan campaign task',
        'points' => 25,
        'platform' => 'x',
        'task_type' => 'social_follow',
        'audience' => 'fan',
        'is_active' => true,
        'display_order' => 1,
        ...$attributes,
    ]);
}

test('admin can assign staff position to a user', function () {
    $admin = createAdminUser();
    $user = createUser();

    $this->actingAs($admin)
        ->postJson("/ops/api/users/{$user->id}/staff-position", [
            'staff_position' => StaffPosition::Ambassador->value,
            'staff_status' => 'active',
        ])
        ->assertSuccessful()
        ->assertJsonPath('staff.position', StaffPosition::Ambassador->value)
        ->assertJsonPath('user.is_staff', true);

    $user->refresh();

    expect($user->is_staff)->toBeTrue()
        ->and($user->staff_position)->toBe(StaffPosition::Ambassador->value)
        ->and($user->staff_status)->toBe('active')
        ->and($user->staff_position_assigned_by)->toBe($admin->id);

    expect(ActivityLog::query()->where('event', 'staff.position_assigned')->exists())->toBeTrue();
});

test('admin can update and remove staff position', function () {
    $admin = createAdminUser();
    $user = createStaffUser(StaffPosition::Ambassador->value, $admin);

    $this->actingAs($admin)
        ->putJson("/ops/api/users/{$user->id}/staff-position", [
            'staff_position' => StaffPosition::Support->value,
            'staff_status' => 'active',
        ])
        ->assertSuccessful()
        ->assertJsonPath('staff.position', StaffPosition::Support->value);

    $this->actingAs($admin)
        ->deleteJson("/ops/api/users/{$user->id}/staff-position")
        ->assertSuccessful();

    $user->refresh();

    expect($user->is_staff)->toBeFalse()
        ->and($user->staff_position)->toBeNull()
        ->and($user->staff_status)->toBeNull();
});

test('non-admin cannot assign staff positions', function () {
    $user = createUser();
    $target = createUser();

    $this->actingAs($user)
        ->postJson("/ops/api/users/{$target->id}/staff-position", [
            'staff_position' => StaffPosition::Ambassador->value,
        ])
        ->assertForbidden();
});

test('regular users cannot access staff dashboard', function () {
    $user = connectRequiredSocialAccounts(createUser());

    $this->actingAs($user)
        ->get('/staff')
        ->assertRedirect(route('fan.daily-claim'))
        ->assertSessionHas('error');
});

test('inactive staff members cannot access staff dashboard', function () {
    $admin = createAdminUser();
    $user = connectRequiredSocialAccounts(
        createStaffUser(StaffPosition::Ambassador->value, $admin)
    );
    $user->forceFill(['staff_status' => 'inactive'])->save();

    $this->actingAs($user)
        ->get('/staff')
        ->assertRedirect(route('fan.daily-claim'));
});

test('active staff members can access staff dashboard', function () {
    $admin = createAdminUser();
    $user = connectRequiredSocialAccounts(
        createStaffUser(StaffPosition::Ambassador->value, $admin)
    );

    $this->actingAs($user)
        ->get('/staff')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Staff')
            ->where('staff.position', StaffPosition::Ambassador->value)
            ->has('performance')
            ->has('tasks'));
});

test('staff page only shows tasks for the user position or direct assignment', function () {
    $admin = createAdminUser();
    $ambassador = connectRequiredSocialAccounts(
        createStaffUser(StaffPosition::Ambassador->value, $admin)
    );
    $support = connectRequiredSocialAccounts(
        createStaffUser(StaffPosition::Support->value, $admin)
    );

    $ambassadorTask = createStaffTask([
        'code' => 'STAFF_AMB_REFERRAL',
        'name' => 'Referral Campaign',
        'staff_position' => StaffPosition::Ambassador->value,
    ]);
    $supportTask = createStaffTask([
        'code' => 'STAFF_SUPPORT_TICKETS',
        'name' => 'Customer Support',
        'staff_position' => StaffPosition::Support->value,
    ]);
    $directTask = createStaffTask([
        'code' => 'STAFF_DIRECT',
        'name' => 'Direct Assignment',
        'assigned_user_id' => $ambassador->id,
    ]);

    $this->actingAs($ambassador)
        ->get('/staff')
        ->assertInertia(fn ($page) => $page
            ->has('tasks', 2)
            ->where('tasks.0.code', $ambassadorTask->code)
            ->where('tasks.1.code', $directTask->code));

    $this->actingAs($support)
        ->get('/staff')
        ->assertInertia(fn ($page) => $page
            ->has('tasks', 1)
            ->where('tasks.0.code', $supportTask->code));
});

test('fan tasks page excludes staff-only tasks', function () {
    $user = connectRequiredSocialAccounts(createUser());
    $fanTask = createFanTask(['code' => 'FAN_VISIBLE']);
    createStaffTask([
        'code' => 'STAFF_HIDDEN',
        'staff_position' => StaffPosition::Ambassador->value,
    ]);

    $this->actingAs($user)
        ->get('/tasks')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('tasks')
            ->where('tasks', fn ($tasks) => collect($tasks)->contains('code', $fanTask->code)
                && ! collect($tasks)->contains('code', 'STAFF_HIDDEN')));
});

test('admin user detail includes staff profile and performance', function () {
    $admin = createAdminUser();
    $user = createStaffUser(StaffPosition::CommunityManager->value, $admin, [
        'total_points' => 1200,
        'referral_count' => 4,
    ]);

    $this->actingAs($admin)
        ->getJson("/ops/api/users/{$user->id}")
        ->assertSuccessful()
        ->assertJsonPath('staff_profile.position', StaffPosition::CommunityManager->value)
        ->assertJsonPath('staff_performance.total_points', 1200)
        ->assertJsonPath('staff_performance.total_referrals', 4);
});

test('admin can create staff task assignments', function () {
    $admin = createAdminUser();
    $staffMember = createStaffUser(StaffPosition::Ambassador->value, $admin);
    $season = Season::query()->where('status', 'active')->first();

    $this->actingAs($admin)
        ->postJson('/ops/api/tasks', [
            'season_id' => $season->id,
            'code' => 'STAFF_EVENT_COORD',
            'name' => 'Event Coordination',
            'description' => 'Coordinate an upcoming fan event.',
            'platform' => 'internal',
            'task_type' => 'event_coordination',
            'points' => 100,
            'audience' => 'staff',
            'staff_position' => StaffPosition::Ambassador->value,
            'assigned_user_id' => $staffMember->id,
            'is_active' => true,
        ])
        ->assertCreated()
        ->assertJsonPath('audience', 'staff')
        ->assertJsonPath('staff_position', StaffPosition::Ambassador->value)
        ->assertJsonPath('assigned_user_id', $staffMember->id);

    expect(Task::query()->where('code', 'STAFF_EVENT_COORD')->exists())->toBeTrue();
});

test('auth user shares staff_active flag when staff position is active', function () {
    $admin = createAdminUser();
    $user = connectRequiredSocialAccounts(
        createStaffUser(StaffPosition::Management->value, $admin)
    );

    $this->actingAs($user)
        ->get('/daily-claim')
        ->assertInertia(fn ($page) => $page
            ->where('auth.user.staff_active', true)
            ->where('auth.user.staff_position', StaffPosition::Management->value));
});

test('users page includes staff position options', function () {
    $admin = createAdminUser();

    $this->actingAs($admin)
        ->get('/ops/users')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('staffPositions', count(StaffPosition::cases())));
});
