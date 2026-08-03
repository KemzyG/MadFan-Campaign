<?php

namespace App\Filament\Resources\LoyaltyTiers;

use App\Enums\AdminPermission;
use App\Filament\Concerns\AuthorizesFilamentResources;
use App\Filament\Navigation\AdminNavigationGroup;
use App\Filament\Resources\LoyaltyTiers\Pages\CreateLoyaltyTier;
use App\Filament\Resources\LoyaltyTiers\Pages\EditLoyaltyTier;
use App\Filament\Resources\LoyaltyTiers\Pages\ListLoyaltyTiers;
use App\Filament\Resources\LoyaltyTiers\Schemas\LoyaltyTierForm;
use App\Filament\Resources\LoyaltyTiers\Tables\LoyaltyTiersTable;
use App\Models\LoyaltyTier;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class LoyaltyTierResource extends Resource
{
    use AuthorizesFilamentResources;

    protected static ?string $model = LoyaltyTier::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedSparkles;

    protected static ?int $navigationSort = 1;

    public static function getNavigationGroup(): string|UnitEnum|null
    {
        return AdminNavigationGroup::LoyaltyAndRewards;
    }

    public static function form(Schema $schema): Schema
    {
        return LoyaltyTierForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return LoyaltyTiersTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function canViewAny(): bool
    {
        return static::adminCan(AdminPermission::LoyaltyTiersManage);
    }

    public static function canCreate(): bool
    {
        return static::adminCan(AdminPermission::LoyaltyTiersManage);
    }

    public static function canEdit($record): bool
    {
        return static::adminCan(AdminPermission::LoyaltyTiersManage);
    }

    public static function canDelete($record): bool
    {
        return static::adminCan(AdminPermission::LoyaltyTiersManage);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListLoyaltyTiers::route('/'),
            'create' => CreateLoyaltyTier::route('/create'),
            'edit' => EditLoyaltyTier::route('/{record}/edit'),
        ];
    }
}
