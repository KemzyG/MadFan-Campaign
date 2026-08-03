<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class FilamentAdminSeeder extends Seeder
{
    /**
     * Default Filament panel login (override via .env):
     * - Email:    admin@madfan.test
     * - Password: ChangeMe123!
     * - Role:     super-admin
     * - URL:      /admin
     *
     * Production (.env):
     * FILAMENT_ADMIN_NAME=
     * FILAMENT_ADMIN_EMAIL=
     * FILAMENT_ADMIN_PASSWORD=
     * FILAMENT_ADMIN_ROLE=super-admin
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            AdminPermissionsSeeder::class,
        ]);

        $name = (string) env('FILAMENT_ADMIN_NAME', 'Mad Fan Admin');
        $email = (string) env('FILAMENT_ADMIN_EMAIL', 'admin@madfan.test');
        $password = (string) env('FILAMENT_ADMIN_PASSWORD', 'ChangeMe123!');
        $role = (string) env('FILAMENT_ADMIN_ROLE', 'super-admin');

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->command?->error('FILAMENT_ADMIN_EMAIL must be a valid email address.');

            return;
        }

        if (strlen($password) < 8) {
            $this->command?->error('FILAMENT_ADMIN_PASSWORD must be at least 8 characters.');

            return;
        }

        if (! in_array($role, User::ADMIN_ROLES, true)) {
            $this->command?->error('FILAMENT_ADMIN_ROLE must be one of: '.implode(', ', User::ADMIN_ROLES));

            return;
        }

        Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);

        // Prefer email match; otherwise reclaim the reserved admin identity so
        // re-seeding never hits users_fan_id_unique after a renamed/deleted admin.
        $user = User::query()->where('email', $email)->first()
            ?? User::query()->where('fan_id', 'MF-ADMIN')->first()
            ?? User::query()->where('username', 'filamentadmin')->first();

        $attributes = [
            'name' => $name,
            'email' => $email,
            'password_hash' => Hash::make($password),
            'auth_provider' => 'password',
            'username' => $this->uniqueUsername('filamentadmin', $user?->id),
            'fan_id' => $this->uniqueFanId('MF-ADMIN', $user?->id),
        ];

        if ($user) {
            $user->update($attributes);
        } else {
            $user = User::query()->create($attributes);
        }

        if (! $user->hasRole($role)) {
            $user->assignRole($role);
        }

        $this->command?->info("Filament admin ready: {$email} / (configured password) → /admin");
    }

    private function uniqueFanId(string $preferred, ?int $ignoreUserId = null): string
    {
        $exists = User::query()
            ->where('fan_id', $preferred)
            ->when($ignoreUserId, fn ($query) => $query->whereKeyNot($ignoreUserId))
            ->exists();

        if (! $exists) {
            return $preferred;
        }

        do {
            $fanId = 'MF-'.strtoupper(Str::random(5));
        } while (User::query()->where('fan_id', $fanId)->exists());

        return $fanId;
    }

    private function uniqueUsername(string $preferred, ?int $ignoreUserId = null): string
    {
        $candidate = $preferred;
        $suffix = 1;

        while (
            User::query()
                ->where('username', $candidate)
                ->when($ignoreUserId, fn ($query) => $query->whereKeyNot($ignoreUserId))
                ->exists()
        ) {
            $candidate = $preferred.$suffix;
            $suffix++;
        }

        return $candidate;
    }
}
