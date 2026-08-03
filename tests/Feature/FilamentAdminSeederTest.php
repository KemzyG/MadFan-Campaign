<?php

use App\Models\User;
use Database\Seeders\FilamentAdminSeeder;
use Illuminate\Support\Facades\Hash;

test('filament admin seeder creates a super admin with panel access', function () {
    $this->seed(FilamentAdminSeeder::class);

    $user = User::query()->where('email', 'admin@madfan.test')->first();

    expect($user)->not->toBeNull()
        ->and($user->hasRole('super-admin'))->toBeTrue()
        ->and($user->canAccessPanel(filament()->getPanel('admin')))->toBeTrue()
        ->and(Hash::check('ChangeMe123!', $user->password_hash))->toBeTrue();
});

test('filament admin seeder respects env overrides and is idempotent', function () {
    putenv('FILAMENT_ADMIN_EMAIL=ops@example.com');
    putenv('FILAMENT_ADMIN_PASSWORD=OpsPassword123');
    putenv('FILAMENT_ADMIN_NAME=Ops Admin');
    putenv('FILAMENT_ADMIN_ROLE=admin');
    $_ENV['FILAMENT_ADMIN_EMAIL'] = 'ops@example.com';
    $_ENV['FILAMENT_ADMIN_PASSWORD'] = 'OpsPassword123';
    $_ENV['FILAMENT_ADMIN_NAME'] = 'Ops Admin';
    $_ENV['FILAMENT_ADMIN_ROLE'] = 'admin';

    $this->seed(FilamentAdminSeeder::class);
    $this->seed(FilamentAdminSeeder::class);

    $users = User::query()->where('email', 'ops@example.com')->get();
    $user = $users->first();

    expect($users)->toHaveCount(1)
        ->and($user->name)->toBe('Ops Admin')
        ->and($user->hasRole('admin'))->toBeTrue()
        ->and(Hash::check('OpsPassword123', $user->password_hash))->toBeTrue();

    putenv('FILAMENT_ADMIN_EMAIL');
    putenv('FILAMENT_ADMIN_PASSWORD');
    putenv('FILAMENT_ADMIN_NAME');
    putenv('FILAMENT_ADMIN_ROLE');
    unset($_ENV['FILAMENT_ADMIN_EMAIL'], $_ENV['FILAMENT_ADMIN_PASSWORD'], $_ENV['FILAMENT_ADMIN_NAME'], $_ENV['FILAMENT_ADMIN_ROLE']);
});

test('filament admin seeder reclaims existing MF-ADMIN fan id instead of duplicating', function () {
    $orphan = User::factory()->create([
        'email' => 'old-admin@madfan.test',
        'username' => 'filamentadmin',
        'fan_id' => 'MF-ADMIN',
        'auth_provider' => 'password',
        'password_hash' => Hash::make('OldPassword123'),
    ]);

    putenv('FILAMENT_ADMIN_EMAIL=admin@madfan.test');
    putenv('FILAMENT_ADMIN_PASSWORD=ChangeMe123!');
    putenv('FILAMENT_ADMIN_NAME=Mad Fan Admin');
    putenv('FILAMENT_ADMIN_ROLE=super-admin');
    $_ENV['FILAMENT_ADMIN_EMAIL'] = 'admin@madfan.test';
    $_ENV['FILAMENT_ADMIN_PASSWORD'] = 'ChangeMe123!';
    $_ENV['FILAMENT_ADMIN_NAME'] = 'Mad Fan Admin';
    $_ENV['FILAMENT_ADMIN_ROLE'] = 'super-admin';

    $this->seed(FilamentAdminSeeder::class);

    expect(User::query()->where('fan_id', 'MF-ADMIN')->count())->toBe(1)
        ->and($orphan->fresh()->email)->toBe('admin@madfan.test')
        ->and($orphan->fresh()->hasRole('super-admin'))->toBeTrue()
        ->and(Hash::check('ChangeMe123!', $orphan->fresh()->password_hash))->toBeTrue();

    putenv('FILAMENT_ADMIN_EMAIL');
    putenv('FILAMENT_ADMIN_PASSWORD');
    putenv('FILAMENT_ADMIN_NAME');
    putenv('FILAMENT_ADMIN_ROLE');
    unset($_ENV['FILAMENT_ADMIN_EMAIL'], $_ENV['FILAMENT_ADMIN_PASSWORD'], $_ENV['FILAMENT_ADMIN_NAME'], $_ENV['FILAMENT_ADMIN_ROLE']);
});
