<?php

namespace App\Filament\Navigation;

enum AdminNavigationGroup: string
{
    case UsersAndFans = 'Users & Fans';
    case LoyaltyAndRewards = 'Loyalty & Rewards';
    case Campaigns = 'Campaigns';
    case Analytics = 'Analytics';
    case SystemAndAudit = 'System & Audit';
    case AccessControl = 'Access Control';
}
