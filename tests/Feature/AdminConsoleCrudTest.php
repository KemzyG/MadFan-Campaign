<?php

use App\Models\Season;
use App\Models\Task;
use App\Support\AdminWorkspace;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;

test('admin dashboard shares role workspace props', function () {
    $admin = createAdminUser();

    $this->actingAs($admin)
        ->get('/ops')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Dashboard')
            ->has('stats')
            ->where('workspace.key', 'admin')
            ->where('workspace.label', 'Operations Desk')
        );
});

test('support desk gets support workspace accent and job', function () {
    $support = createSupportAdmin();

    expect(AdminWorkspace::for($support)['key'])->toBe('support')
        ->and(AdminWorkspace::for($support)['accent'])->toBe('sky');

    $this->actingAs($support)
        ->get('/ops')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('workspace.key', 'support')
            ->where('dashboard_mode', 'platform')
        );
});

test('admin can access profile and update name', function () {
    $admin = createAdminUser(['name' => 'Before']);

    $this->actingAs($admin)
        ->get(route('admin.profile'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('Admin/Profile/Edit'));

    $this->withoutMiddleware(PreventRequestForgery::class);

    $this->actingAs($admin)
        ->put(route('admin.profile.update'), [
            'name' => 'After Name',
            'email' => $admin->email,
        ])
        ->assertRedirect(route('admin.profile'))
        ->assertSessionHas('success');

    expect($admin->fresh()->name)->toBe('After Name');
});

test('tasks page includes failed verification count and full task update works', function () {
    $admin = createAdminUser();
    $season = Season::factory()->create();
    $task = Task::factory()->create([
        'season_id' => $season->id,
        'name' => 'Old name',
        'platform' => 'internal',
    ]);

    $this->actingAs($admin)
        ->get('/ops/tasks')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Tasks/Index')
            ->has('failed_verification_count')
            ->has('platforms')
        );

    $this->actingAs($admin)
        ->putJson("/ops/api/tasks/{$task->id}", [
            'name' => 'Updated task',
            'description' => 'Full CRUD description',
            'platform' => 'discord',
            'task_type' => 'social',
            'verification_required' => true,
            'steps' => [
                ['description' => 'Join the server', 'link_url' => 'https://discord.gg/test', 'link_label' => 'Join'],
            ],
        ])
        ->assertSuccessful()
        ->assertJsonPath('name', 'Updated task')
        ->assertJsonPath('platform', 'discord');

    expect($task->fresh()->name)->toBe('Updated task')
        ->and($task->fresh()->taskSteps)->toHaveCount(1);
});

test('super-admin can provision inertia operators via admin api', function () {
    seedRoles();
    $super = createSuperAdminUser();

    $this->actingAs($super)
        ->postJson('/ops/api/admins', [
            'name' => 'Ops User',
            'email' => 'ops-user@madfan.test',
            'password' => validTestPassword(),
            'role' => 'support',
        ])
        ->assertCreated()
        ->assertJsonPath('email', 'ops-user@madfan.test');
});
