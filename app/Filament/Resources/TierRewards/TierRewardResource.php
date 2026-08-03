<?php

namespace App\Filament\Resources\TierRewards;

use App\Enums\AdminPermission;
use App\Filament\Concerns\AuthorizesFilamentResources;
use App\Filament\Navigation\AdminNavigationGroup;
use App\Filament\Resources\TierRewards\Pages\CreateTierReward;
use App\Filament\Resources\TierRewards\Pages\EditTierReward;
use App\Filament\Resources\TierRewards\Pages\ListTierRewards;
use App\Filament\Resources\TierRewards\Schemas\TierRewardForm;
use App\Filament\Resources\TierRewards\Tables\TierRewardsTable;
use App\Models\TierReward;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class TierRewardResource extends Resource
{
    use AuthorizesFilamentResources;

    protected static ?string $model = TierReward::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedGift;

    protected static ?int $navigationSort = 2;

    public static function getNavigationGroup(): string|UnitEnum|null
    {
        return AdminNavigationGroup::LoyaltyAndRewards;
    }

    public static function form(Schema $schema): Schema
    {
        return TierRewardForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return TierRewardsTable::configure($table);
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
            'index' => ListTierRewards::route('/'),
            'create' => CreateTierReward::route('/create'),
            'edit' => EditTierReward::route('/{record}/edit'),
        ];
    }
}
