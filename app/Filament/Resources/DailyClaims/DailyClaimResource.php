<?php

namespace App\Filament\Resources\DailyClaims;

use App\Enums\AdminPermission;
use App\Filament\Concerns\AuthorizesFilamentResources;
use App\Filament\Navigation\AdminNavigationGroup;
use App\Filament\Resources\DailyClaims\Pages\CreateDailyClaim;
use App\Filament\Resources\DailyClaims\Pages\EditDailyClaim;
use App\Filament\Resources\DailyClaims\Pages\ListDailyClaims;
use App\Filament\Resources\DailyClaims\Schemas\DailyClaimForm;
use App\Filament\Resources\DailyClaims\Tables\DailyClaimsTable;
use App\Models\DailyClaim;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class DailyClaimResource extends Resource
{
    use AuthorizesFilamentResources;

    protected static ?string $model = DailyClaim::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedCheckCircle;

    protected static ?int $navigationSort = 3;

    public static function getNavigationGroup(): string|UnitEnum|null
    {
        return AdminNavigationGroup::LoyaltyAndRewards;
    }

    public static function form(Schema $schema): Schema
    {
        return DailyClaimForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return DailyClaimsTable::configure($table);
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
            'index' => ListDailyClaims::route('/'),
            'create' => CreateDailyClaim::route('/create'),
            'edit' => EditDailyClaim::route('/{record}/edit'),
        ];
    }
}
