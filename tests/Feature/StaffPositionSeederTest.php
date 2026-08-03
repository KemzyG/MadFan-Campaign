<?php

use App\Enums\StaffPosition;
use App\Models\Task;
use App\Models\User;
use Database\Seeders\SeasonSeeder;
use Database\Seeders\StaffPositionSeeder;

beforeEach(function () {
    $this->seed(SeasonSeeder::class);
});

test('staff position seeder creates demo staff users and tasks', function () {
    $this->seed(StaffPositionSeeder::class);

    $demoStaff = User::query()->where('email', 'staff@madfan.test')->first();
    $admin = User::query()->where('email', 'admin@madfan.test')->first();

    expect($demoStaff)->not->toBeNull()
        ->and($demoStaff->is_staff)->toBeTrue()
        ->and($demoStaff->staff_position)->toBe(StaffPosition::Ambassador->value)
        ->and($demoStaff->staff_status)->toBe('active')
        ->and($demoStaff->staff_position_assigned_by)->toBe($admin?->id)
        ->and($demoStaff->socialAccounts()->count())->toBeGreaterThanOrEqual(2);

    expect(User::query()->where('is_staff', true)->count())->toBe(4);

    expect(Task::query()->where('audience', 'staff')->count())->toBe(6)
        ->and(Task::query()->where('code', 'STAFF_EVENT_COORDINATION')->value('assigned_user_id'))->toBe($demoStaff->id);
});

test('seeded staff demo user sees staff dashboard link in fan sidebar', function () {
    $this->seed(StaffPositionSeeder::class);

    $staff = User::query()->where('email', 'staff@madfan.test')->firstOrFail();

    $this->actingAs($staff)
        ->get('/daily-claim')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('auth.user.staff_active', true)
            ->where('auth.user.staff_position', StaffPosition::Ambassador->value));

    $this->actingAs($staff)
        ->get('/')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Fan/Campaign')
            ->where('auth.user.staff_active', true));
});
