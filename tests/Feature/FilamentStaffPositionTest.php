<?php

use App\Enums\StaffPosition;
use App\Enums\TaskAudience;
use App\Filament\Resources\Tasks\Pages\CreateTask;
use App\Filament\Resources\Users\Pages\EditUser;
use App\Filament\Resources\Users\Pages\ListUsers;
use App\Models\ActivityLog;
use App\Models\Season;
use App\Models\Task;
use App\Models\User;
use Database\Seeders\SeasonSeeder;
use Filament\Actions\Testing\TestAction;
use Livewire\Livewire;

beforeEach(function () {
    $this->seed(SeasonSeeder::class);
});

test('filament users list shows staff position columns', function () {
    $admin = createSuperAdminUser();

    $this->actingAs($admin)
        ->get('/admin/users')
        ->assertSuccessful()
        ->assertSee('Staff position');
});

test('filament admin can assign staff position from user edit page', function () {
    $admin = createSuperAdminUser();
    $user = createUser();

    $this->actingAs($admin);

    Livewire::test(EditUser::class, ['record' => $user->id])
        ->mountAction('assignStaffPosition')
        ->set('mountedActions.0.data.staff_position', StaffPosition::Ambassador->value)
        ->set('mountedActions.0.data.staff_status', 'active')
        ->callMountedAction()
        ->assertHasNoActionErrors();

    $user->refresh();

    expect($user->is_staff)->toBeTrue()
        ->and($user->staff_position)->toBe(StaffPosition::Ambassador->value)
        ->and($user->staff_status)->toBe('active')
        ->and($user->staff_position_assigned_by)->toBe($admin->id);

    expect(ActivityLog::query()->where('event', 'staff.position_assigned')->exists())->toBeTrue();
});

test('filament admin can update staff position from users table action', function () {
    $admin = createSuperAdminUser();
    $user = User::factory()->staff(StaffPosition::Ambassador->value, $admin)->create();

    $this->actingAs($admin);

    Livewire::test(ListUsers::class)
        ->mountAction(TestAction::make('assignStaffPosition')->table($user))
        ->set('mountedActions.0.data.staff_position', StaffPosition::Support->value)
        ->set('mountedActions.0.data.staff_status', 'active')
        ->callMountedAction()
        ->assertHasNoActionErrors();

    $user->refresh();

    expect($user->staff_position)->toBe(StaffPosition::Support->value);
});

test('filament admin can remove staff position from user edit page', function () {
    $admin = createSuperAdminUser();
    $user = User::factory()->staff(StaffPosition::Ambassador->value, $admin)->create();

    $this->actingAs($admin);

    Livewire::test(EditUser::class, ['record' => $user->id])
        ->mountAction('removeStaffPosition')
        ->callMountedAction()
        ->assertHasNoActionErrors();

    $user->refresh();

    expect($user->is_staff)->toBeFalse()
        ->and($user->staff_position)->toBeNull();
});

test('filament task create form includes staff assignment fields', function () {
    $admin = createSuperAdminUser();

    $this->actingAs($admin);

    Livewire::test(CreateTask::class)
        ->assertFormFieldExists('audience')
        ->assertFormFieldExists('staff_position')
        ->assertFormFieldExists('assigned_user_id');
});

test('filament admin can create staff task from task resource', function () {
    $admin = createSuperAdminUser();
    $staffMember = User::factory()->staff(StaffPosition::Ambassador->value, $admin)->create();
    $season = Season::query()->where('status', 'active')->first();

    $this->actingAs($admin);

    Livewire::test(CreateTask::class)
        ->set('data.season_id', $season->id)
        ->set('data.code', 'FILAMENT_STAFF_TASK')
        ->set('data.name', 'Community Moderation')
        ->set('data.description', 'Moderate community channels this week.')
        ->set('data.points', 75)
        ->set('data.display_order', 5)
        ->set('data.platform', 'internal')
        ->set('data.task_type', 'community_moderation')
        ->set('data.audience', TaskAudience::Staff->value)
        ->set('data.staff_position', StaffPosition::Ambassador->value)
        ->set('data.assigned_user_id', $staffMember->id)
        ->set('data.is_active', true)
        ->call('create')
        ->assertHasNoFormErrors();

    $task = Task::query()->where('code', 'FILAMENT_STAFF_TASK')->first();

    expect($task)->not->toBeNull()
        ->and($task->audience)->toBe(TaskAudience::Staff->value)
        ->and($task->staff_position)->toBe(StaffPosition::Ambassador->value)
        ->and($task->assigned_user_id)->toBe($staffMember->id);
});

test('filament user edit page shows staff information section', function () {
    $admin = createSuperAdminUser();
    $user = User::factory()->staff(StaffPosition::Management->value, $admin)->create();

    $this->actingAs($admin);

    Livewire::test(EditUser::class, ['record' => $user->id])
        ->assertSee('Staff information')
        ->assertSee('Staff performance')
        ->assertSee('Management');
});
