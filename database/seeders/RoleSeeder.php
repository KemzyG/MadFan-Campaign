<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * @var array<int, string>
     */
    private const ROLES = [
        'super-admin',
        'admin',
        'support',
        'management',
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (self::ROLES as $role) {
            Role::firstOrCreate(
                ['name' => $role, 'guard_name' => 'web'],
            );
        }
    }
}
