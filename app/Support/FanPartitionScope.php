<?php

namespace App\Support;

use App\Models\AdminOrganization;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class FanPartitionScope
{
    public static function apply(Builder $query, ?AdminOrganization $organization, User $actor): Builder
    {
        $query->fanAccounts();

        if ($actor->hasRole('super-admin')) {
            if ($organization === null || ! $organization->hasActivePartitions()) {
                return $query;
            }

            return self::applyOrganizationRules($query, $organization);
        }

        if ($organization === null) {
            if ($actor->isActiveStaffMember()) {
                return $query;
            }

            return $query->whereRaw('0 = 1');
        }

        if (! $organization->hasActivePartitions()) {
            return $query;
        }

        return self::applyOrganizationRules($query, $organization);
    }

    public static function fanIsVisible(User $fan, ?AdminOrganization $organization, User $actor): bool
    {
        if ($fan->hasAnyRole(User::ADMIN_ROLES)) {
            return false;
        }

        if ($actor->hasRole('super-admin')) {
            if ($organization === null || ! $organization->hasActivePartitions()) {
                return true;
            }

            return self::fanMatchesOrganization($fan, $organization);
        }

        if ($organization === null) {
            return $actor->isActiveStaffMember();
        }

        if (! $organization->hasActivePartitions()) {
            return true;
        }

        return self::fanMatchesOrganization($fan, $organization);
    }

    public static function applyOrganizationRules(Builder $query, AdminOrganization $organization): Builder
    {
        return $query->where(function (Builder $partitionQuery) use ($organization): void {
            $hasRule = false;

            if (filled($organization->partition_countries)) {
                $partitionQuery->orWhereIn('country', $organization->partition_countries);
                $hasRule = true;
            }

            if (filled($organization->partition_leagues)) {
                $partitionQuery->orWhereIn('league', $organization->partition_leagues);
                $hasRule = true;
            }

            if (filled($organization->partition_clubs)) {
                $partitionQuery->orWhereIn('club', $organization->partition_clubs);
                $hasRule = true;
            }

            if (! $hasRule) {
                $partitionQuery->whereRaw('1 = 1');
            }
        });
    }

    public static function fanMatchesOrganization(User $fan, AdminOrganization $organization): bool
    {
        if (filled($organization->partition_countries) && in_array($fan->country, $organization->partition_countries, true)) {
            return true;
        }

        if (filled($organization->partition_leagues) && in_array($fan->league, $organization->partition_leagues, true)) {
            return true;
        }

        if (filled($organization->partition_clubs) && in_array($fan->club, $organization->partition_clubs, true)) {
            return true;
        }

        return false;
    }
}
