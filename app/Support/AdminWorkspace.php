<?php

namespace App\Support;

use App\Enums\AdminPermission;
use App\Models\User;

/**
 * Role-based Inertia admin workspace (look + job focus).
 * Not SaaS multi-tenancy — one product, different operator desks.
 */
class AdminWorkspace
{
    /**
     * @return array{
     *     key: string,
     *     label: string,
     *     tagline: string,
     *     accent: string,
     *     job: string,
     *     focus: list<string>,
     * }
     */
    public static function for(User $user): array
    {
        $role = self::primaryRole($user);

        return match ($role) {
            'super-admin' => [
                'key' => 'super-admin',
                'label' => 'Platform Command',
                'tagline' => 'Full control · security · operator accounts',
                'accent' => 'violet',
                'job' => 'Govern roles, admins, settings, and system health.',
                'focus' => ['admins', 'roles', 'settings', 'system-logs', 'dashboard'],
            ],
            'admin' => [
                'key' => 'admin',
                'label' => 'Operations Desk',
                'tagline' => 'Campaigns · fans · loyalty ops',
                'accent' => 'brand',
                'job' => 'Run seasons, tasks, reviews, and fan operations.',
                'focus' => ['tasks', 'task-reviews', 'users', 'seasons', 'leagues', 'clubs', 'jerseys', 'jersey-orders', 'referrals', 'staff'],
            ],
            'management', 'staff-management' => [
                'key' => 'management',
                'label' => 'Growth Desk',
                'tagline' => 'Loyalty · seasons · performance',
                'accent' => 'amber',
                'job' => 'Shape seasons, tiers, tasks, and referral growth.',
                'focus' => ['tasks', 'seasons', 'loyalty-tiers', 'leagues', 'clubs', 'jerseys', 'jersey-orders', 'referrals', 'point-transactions', 'dashboard'],
            ],
            'support', 'staff-support' => [
                'key' => 'support',
                'label' => 'Support Desk',
                'tagline' => 'Fans · tasks · help queue',
                'accent' => 'sky',
                'job' => 'Help fans, manage tasks, and review jersey orders.',
                'focus' => ['dashboard', 'tasks', 'task-reviews', 'users', 'jersey-orders', 'referrals'],
            ],
            'staff-community_manager' => [
                'key' => 'community',
                'label' => 'Community Desk',
                'tagline' => 'Engagement · referrals · fans',
                'accent' => 'brand',
                'job' => 'Coordinate community engagement and review fan profiles.',
                'focus' => ['dashboard', 'users', 'referrals'],
            ],
            'staff-ambassador' => [
                'key' => 'ambassador',
                'label' => 'Ambassador Desk',
                'tagline' => 'Your performance · outreach stats',
                'accent' => 'amber',
                'job' => 'Track your ambassador performance and personal stats.',
                'focus' => ['dashboard'],
            ],
            'staff-admin' => [
                'key' => 'staff-admin',
                'label' => 'Staff Ops Desk',
                'tagline' => 'Tasks · fans · seasons',
                'accent' => 'brand',
                'job' => 'Operate campaigns and review fan profiles.',
                'focus' => ['dashboard', 'tasks', 'users', 'seasons', 'jerseys', 'jersey-orders', 'referrals'],
            ],
            default => [
                'key' => 'operator',
                'label' => 'Admin Console',
                'tagline' => 'Mad Fan operations',
                'accent' => 'brand',
                'job' => 'Operate the Mad Fan admin console.',
                'focus' => ['dashboard'],
            ],
        };
    }

    public static function primaryRole(User $user): string
    {
        $order = ['super-admin', 'admin', 'management', 'support'];

        foreach ($order as $role) {
            if ($user->hasRole($role)) {
                return $role;
            }
        }

        if ($user->isActiveStaffMember() && filled($user->staff_position)) {
            return 'staff-'.$user->staff_position;
        }

        return (string) ($user->getRoleNames()->first() ?? 'operator');
    }

    /**
     * Whether the user can open the Settings segment of the console.
     */
    public static function canViewSettings(User $user): bool
    {
        return $user->can(AdminPermission::SettingsView->value);
    }
}
