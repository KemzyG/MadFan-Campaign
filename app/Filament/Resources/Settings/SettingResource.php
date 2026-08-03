<?php

namespace App\Filament\Resources\Settings;

use App\Enums\AdminPermission;
use App\Filament\Concerns\AuthorizesFilamentResources;
use App\Filament\Navigation\AdminNavigationGroup;
use App\Filament\Resources\Settings\Pages\ManageSettings;
use App\Models\Setting;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Support\Icons\Heroicon;
use UnitEnum;

class SettingResource extends Resource
{
    use AuthorizesFilamentResources;

    protected static ?string $model = Setting::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedCog;

    protected static ?int $navigationSort = 3;

    protected static ?string $navigationLabel = 'Settings';

    protected static ?string $slug = 'settings';

    public static function getNavigationGroup(): string|UnitEnum|null
    {
        return AdminNavigationGroup::SystemAndAudit;
    }

    public static function canViewAny(): bool
    {
        return static::adminCan(AdminPermission::SettingsView);
    }

    public static function canEdit($record): bool
    {
        return static::adminCan(AdminPermission::SettingsUpdate);
    }

    public static function getPages(): array
    {
        return [
            'index' => ManageSettings::route('/'),
        ];
    }
}
