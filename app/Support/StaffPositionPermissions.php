<?php

namespace App\Support;

use App\Enums\AdminPermission;
use App\Enums\StaffPosition;

/**
 * Spatie permissions granted to community staff for Inertia admin console access.
 * Restrictions are enforced via $user->can(...) — not via ADMIN_ROLES.
 */
class StaffPositionPermissions
{
    /**
     * @return list<string>
     */
    public static function for(StaffPosition $position): array
    {
        return match ($position) {
            StaffPosition::Ambassador => [
                AdminPermission::DashboardView->value,
            ],
            StaffPosition::CommunityManager => [
                AdminPermission::DashboardView->value,
                AdminPermission::UsersView->value,
                AdminPermission::ReferralsView->value,
            ],
            StaffPosition::Support => [
                AdminPermission::DashboardView->value,
                AdminPermission::UsersView->value,
                AdminPermission::TasksManage->value,
                AdminPermission::ReferralsView->value,
                AdminPermission::JerseyOrdersView->value,
            ],
            StaffPosition::Management => [
                AdminPermission::DashboardView->value,
                AdminPermission::UsersView->value,
                AdminPermission::TasksManage->value,
                AdminPermission::SeasonsManage->value,
                AdminPermission::LoyaltyTiersManage->value,
                AdminPermission::LeaguesManage->value,
                AdminPermission::ClubsManage->value,
                AdminPermission::JerseysManage->value,
                AdminPermission::JerseyOrdersView->value,
                AdminPermission::JerseyOrdersManage->value,
                AdminPermission::MediaManage->value,
                AdminPermission::ReferralsView->value,
                AdminPermission::PointTransactionsView->value,
            ],
            // Elevated staff-ops desk — still not platform analytics / Staff directory / user CRUD.
            StaffPosition::Admin => [
                AdminPermission::DashboardView->value,
                AdminPermission::UsersView->value,
                AdminPermission::TasksManage->value,
                AdminPermission::SeasonsManage->value,
                AdminPermission::LoyaltyTiersManage->value,
                AdminPermission::LeaguesManage->value,
                AdminPermission::ClubsManage->value,
                AdminPermission::JerseysManage->value,
                AdminPermission::JerseyOrdersView->value,
                AdminPermission::JerseyOrdersManage->value,
                AdminPermission::MediaManage->value,
                AdminPermission::ReferralsView->value,
                AdminPermission::PointTransactionsView->value,
                AdminPermission::SettingsView->value,
            ],
        };
    }
}
