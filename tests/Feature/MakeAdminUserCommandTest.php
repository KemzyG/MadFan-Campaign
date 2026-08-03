<?php

use App\Models\User;

test('make admin user command creates an inertia operator without filament access', function () {
    seedRoles();

    $this->artisan('make:admin-user', [
        '--name' => 'Panel Admin',
        '--email' => 'panel-admin@example.com',
        '--password' => validTestPassword(),
        '--no-interaction' => true,
    ])->assertSuccessful();

    $user = User::where('email', 'panel-admin@example.com')->first();

    expect($user)->not->toBeNull()
        ->and($user->hasRole('admin'))->toBeTrue()
        ->and($user->canAccessPanel(filament()->getPanel('admin')))->toBeFalse();
});

test('make admin user command updates an existing user password and role', function () {
    $user = createUser(['email' => 'existing-admin@example.com']);

    $this->artisan('make:admin-user', [
        '--name' => 'Updated Admin',
        '--email' => 'existing-admin@example.com',
        '--password' => 'NewPassword123456',
        '--no-interaction' => true,
    ])->assertSuccessful();

    $user->refresh();

    expect($user->name)->toBe('Updated Admin')
        ->and($user->hasRole('admin'))->toBeTrue();
});
