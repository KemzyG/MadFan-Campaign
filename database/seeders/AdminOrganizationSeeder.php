<?php

namespace Database\Seeders;

use App\Models\AdminOrganization;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminOrganizationSeeder extends Seeder
{
    public function run(): void
    {
        $global = AdminOrganization::query()->updateOrCreate(
            ['slug' => 'global-ops'],
            [
                'name' => 'Global Operations',
                'description' => 'Default operator partition with visibility across all fans.',
                'partition_countries' => null,
                'partition_leagues' => null,
                'partition_clubs' => null,
                'is_active' => true,
            ],
        );

        User::role(User::INERTIA_ADMIN_ROLES)->each(function (User $operator) use ($global): void {
            $operator->adminOrganizations()->syncWithoutDetaching([$global->id]);

            if ($operator->current_admin_organization_id === null) {
                $operator->forceFill(['current_admin_organization_id' => $global->id])->save();
            }
        });
    }
}
