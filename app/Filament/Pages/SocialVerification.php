<?php

namespace App\Filament\Pages;

use App\Filament\Navigation\AdminNavigationGroup;
use BackedEnum;
use Filament\Pages\Page;
use Filament\Support\Icons\Heroicon;
use UnitEnum;

class SocialVerification extends Page
{
    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedGlobeAlt;

    protected static ?int $navigationSort = 3;

    protected static ?string $navigationLabel = 'Social Verification';

    protected string $view = 'filament.pages.social-verification';

    public static function getNavigationGroup(): string|UnitEnum|null
    {
        return AdminNavigationGroup::Campaigns;
    }
}
