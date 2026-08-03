<?php

namespace App\Filament\Pages;

use App\Filament\Navigation\AdminNavigationGroup;
use BackedEnum;
use Filament\Pages\Page;
use Filament\Support\Icons\Heroicon;
use UnitEnum;

class ApiDocs extends Page
{
    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedDocumentText;

    protected static ?int $navigationSort = 4;

    protected static ?string $navigationLabel = 'API Docs';

    protected string $view = 'filament.pages.api-docs';

    public static function getNavigationGroup(): string|UnitEnum|null
    {
        return AdminNavigationGroup::SystemAndAudit;
    }
}
