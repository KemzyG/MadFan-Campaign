<?php

namespace App\Enums;

enum AdminPermission: string
{
    case DashboardView = 'dashboard.view';
    case DashboardPlatform = 'dashboard.platform';

    case UsersView = 'users.view';
    case UsersCreate = 'users.create';
    case UsersUpdate = 'users.update';
    case UsersDelete = 'users.delete';
    case UsersAssignRole = 'users.assign-role';

    case StaffView = 'staff.view';
    case StaffManage = 'staff.manage';

    case TasksManage = 'tasks.manage';
    case SeasonsManage = 'seasons.manage';
    case LoyaltyTiersManage = 'loyalty-tiers.manage';
    case LeaguesManage = 'leagues.manage';
    case ClubsManage = 'clubs.manage';

    case JerseysManage = 'jerseys.manage';
    case JerseyOrdersView = 'jersey-orders.view';
    case JerseyOrdersManage = 'jersey-orders.manage';

    case ReferralsView = 'referrals.view';
    case PointTransactionsView = 'point-transactions.view';

    case SettingsView = 'settings.view';
    case SettingsUpdate = 'settings.update';

    case AdminsView = 'admins.view';
    case AdminsManage = 'admins.manage';

    case RolesView = 'roles.view';
    case RolesManage = 'roles.manage';

    case ActivityLogsView = 'activity-logs.view';
    case SystemLogsView = 'system-logs.view';
    case SystemLogsClear = 'system-logs.clear';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(fn (self $permission): string => $permission->value, self::cases());
    }

    public function label(): string
    {
        return str($this->value)->replace(['.', '-'], ' ')->title()->toString();
    }
}
