<?php

namespace Database\Seeders;

use App\Enums\StaffPosition;
use App\Enums\StaffStatus;
use App\Models\Season;
use App\Models\SocialAccount;
use App\Models\Task;
use App\Models\User;
use App\Services\Staff\StaffAssignmentService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class StaffPositionSeeder extends Seeder
{
    /**
     * Demo credentials after seeding:
     * - staff@madfan.test / password (Ambassador — primary staff demo account)
     * - admin@madfan.test / password (panel admin who assigned staff)
     */
    public function run(): void
    {
        $season = Season::query()->where('status', 'active')->first();

        if (! $season) {
            return;
        }

        $assigner = $this->seedAssigner();
        $staffUsers = $this->seedStaffMembers($assigner);
        $this->seedStaffTasks($season, $staffUsers['demo']);
    }

    protected function seedAssigner(): User
    {
        foreach (['super-admin', 'admin', 'support', 'management'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        $admin = User::query()->firstOrCreate(
            ['email' => 'admin@madfan.test'],
            [
                'name' => 'Mad Fan Admin',
                'username' => 'madfanadmin',
                'password_hash' => Hash::make('password'),
                'auth_provider' => 'password',
                'fan_id' => 'MF-ADMIN',
                'total_points' => 0,
            ],
        );

        if (! $admin->hasRole('admin')) {
            $admin->assignRole('admin');
        }

        return $admin;
    }

    /**
     * @return array{demo: User, members: list<User>}
     */
    protected function seedStaffMembers(User $assigner): array
    {
        $service = app(StaffAssignmentService::class);

        $definitions = [
            [
                'email' => 'staff@madfan.test',
                'name' => 'Staff Demo',
                'username' => 'staffdemo',
                'fan_id' => 'MF-STAFF',
                'position' => StaffPosition::Ambassador,
                'total_points' => 2400,
                'referral_count' => 6,
            ],
            [
                'email' => 'community@madfan.test',
                'name' => 'Casey Community',
                'username' => 'caseycommunity',
                'fan_id' => 'MF-COMM1',
                'position' => StaffPosition::CommunityManager,
                'total_points' => 1800,
                'referral_count' => 3,
            ],
            [
                'email' => 'support@madfan.test',
                'name' => 'Sam Support',
                'username' => 'samsupport',
                'fan_id' => 'MF-SUP01',
                'position' => StaffPosition::Support,
                'total_points' => 950,
                'referral_count' => 1,
            ],
            [
                'email' => 'management@madfan.test',
                'name' => 'Morgan Management',
                'username' => 'morganmgmt',
                'fan_id' => 'MF-MGMT1',
                'position' => StaffPosition::Management,
                'total_points' => 4200,
                'referral_count' => 8,
            ],
        ];

        $members = [];
        $demo = null;

        foreach ($definitions as $definition) {
            $user = User::query()->updateOrCreate(
                ['email' => $definition['email']],
                [
                    'name' => $definition['name'],
                    'username' => $definition['username'],
                    'password_hash' => Hash::make('password'),
                    'auth_provider' => 'password',
                    'fan_id' => $definition['fan_id'],
                    'total_points' => $definition['total_points'],
                    'referral_count' => $definition['referral_count'],
                ],
            );

            $this->ensureSocialConnections($user);

            if ($user->is_staff && $user->staff_position === $definition['position']->value) {
                $user->update(['staff_status' => StaffStatus::Active->value]);
                $service->syncConsolePermissions($user->fresh(), $definition['position'], StaffStatus::Active);
            } else {
                $service->assign($user, $definition['position'], $assigner, StaffStatus::Active);
            }

            $members[] = $user->fresh();

            if ($definition['email'] === 'staff@madfan.test') {
                $demo = $user->fresh();
            }
        }

        return [
            'demo' => $demo ?? $members[0],
            'members' => $members,
        ];
    }

    protected function ensureSocialConnections(User $user): void
    {
        if ($user->socialAccounts()->count() >= 2) {
            return;
        }

        SocialAccount::factory()->x('@'.$user->username)->create(['user_id' => $user->id]);
        SocialAccount::factory()->discord($user->username)->create(['user_id' => $user->id]);
    }

    protected function seedStaffTasks(Season $season, User $demoStaff): void
    {
        $seasonWeek = $season->seasonWeeks()->orderBy('week_number')->value('id');

        $tasks = [
            [
                'code' => 'STAFF_REFERRAL_CAMPAIGN',
                'name' => 'Referral Campaign',
                'description' => 'Drive new fan signups through your referral link this week.',
                'points' => 150,
                'platform' => 'internal',
                'task_type' => 'referral_campaign',
                'audience' => 'staff',
                'staff_position' => StaffPosition::Ambassador->value,
                'assigned_user_id' => null,
                'display_order' => 101,
            ],
            [
                'code' => 'STAFF_DAILY_TEAM_CLAIM',
                'name' => 'Daily Team Claim',
                'description' => 'Complete the daily team claim check-in for your squad.',
                'points' => 50,
                'platform' => 'internal',
                'task_type' => 'daily_team_claim',
                'audience' => 'staff',
                'staff_position' => null,
                'assigned_user_id' => null,
                'display_order' => 102,
            ],
            [
                'code' => 'STAFF_COMMUNITY_MODERATION',
                'name' => 'Community Moderation',
                'description' => 'Review flagged community posts and keep channels on-mission.',
                'points' => 100,
                'platform' => 'discord',
                'task_type' => 'community_moderation',
                'audience' => 'staff',
                'staff_position' => StaffPosition::CommunityManager->value,
                'assigned_user_id' => null,
                'display_order' => 103,
            ],
            [
                'code' => 'STAFF_CUSTOMER_SUPPORT',
                'name' => 'Customer Support Shift',
                'description' => 'Respond to fan support tickets and onboarding questions.',
                'points' => 75,
                'platform' => 'internal',
                'task_type' => 'customer_support',
                'audience' => 'staff',
                'staff_position' => StaffPosition::Support->value,
                'assigned_user_id' => null,
                'display_order' => 104,
            ],
            [
                'code' => 'STAFF_EVENT_COORDINATION',
                'name' => 'Event Coordination',
                'description' => 'Coordinate the upcoming community event schedule and announcements.',
                'points' => 120,
                'platform' => 'internal',
                'task_type' => 'event_coordination',
                'audience' => 'staff',
                'staff_position' => StaffPosition::Ambassador->value,
                'assigned_user_id' => $demoStaff->id,
                'display_order' => 105,
            ],
            [
                'code' => 'STAFF_CONTENT_REVIEW',
                'name' => 'Content Review',
                'description' => 'Review campaign content before it goes live to fans.',
                'points' => 90,
                'platform' => 'internal',
                'task_type' => 'content_review',
                'audience' => 'staff',
                'staff_position' => StaffPosition::Management->value,
                'assigned_user_id' => null,
                'display_order' => 106,
            ],
        ];

        foreach ($tasks as $taskData) {
            Task::query()->updateOrCreate(
                ['code' => $taskData['code']],
                [
                    ...$taskData,
                    'season_id' => $season->id,
                    'season_week_id' => $seasonWeek,
                    'verification_required' => false,
                    'is_active' => true,
                ],
            );
        }
    }
}
