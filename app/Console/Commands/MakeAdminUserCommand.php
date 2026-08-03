<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\AdminPermissionsSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class MakeAdminUserCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'make:admin-user
                            {--name=Admin User : The admin display name}
                            {--email= : A valid and unique email address}
                            {--password= : The password (min. 8 characters)}
                            {--role=admin : Admin role to assign}';

    /**
     * @var string
     */
    protected $description = 'Create a Filament admin user with the required role';

    public function handle(): int
    {
        $this->call(RoleSeeder::class, ['--no-interaction' => true]);
        $this->call(AdminPermissionsSeeder::class, ['--no-interaction' => true]);

        $name = (string) $this->option('name');
        $email = $this->option('email') ?? $this->ask('Email address');
        $password = $this->option('password') ?? $this->secret('Password');
        $role = (string) $this->option('role');

        if (! is_string($email) || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('A valid email address is required. Pass --email when using --no-interaction.');

            return self::FAILURE;
        }

        if (! is_string($password) || strlen($password) < 8) {
            $this->error('A password of at least 8 characters is required. Pass --password when using --no-interaction.');

            return self::FAILURE;
        }

        if (! in_array($role, User::ADMIN_ROLES, true)) {
            $this->error('Role must be one of: '.implode(', ', User::ADMIN_ROLES));

            return self::FAILURE;
        }

        Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);

        $user = User::query()->where('email', $email)->first();

        if ($user) {
            $user->update([
                'name' => $name,
                'password_hash' => Hash::make($password),
            ]);

            $this->warn("User {$email} already exists. Name and password were updated.");
        } else {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password_hash' => Hash::make($password),
                'auth_provider' => 'password',
            ]);
        }

        if (! $user->hasRole($role)) {
            $user->assignRole($role);
        }

        $this->components->info("Success! {$email} may now log in at /admin");

        return self::SUCCESS;
    }
}
