<?php

namespace App\Filament\Resources\Referrals;

use App\Enums\AdminPermission;
use App\Filament\Concerns\AuthorizesFilamentResources;
use App\Filament\Navigation\AdminNavigationGroup;
use App\Filament\Resources\Referrals\Pages\CreateReferral;
use App\Filament\Resources\Referrals\Pages\EditReferral;
use App\Filament\Resources\Referrals\Pages\ListReferrals;
use App\Filament\Resources\Referrals\Schemas\ReferralForm;
use App\Filament\Resources\Referrals\Tables\ReferralsTable;
use App\Models\Referral;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class ReferralResource extends Resource
{
    use AuthorizesFilamentResources;

    protected static ?string $model = Referral::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedUserPlus;

    protected static ?int $navigationSort = 2;

    public static function getNavigationGroup(): string|UnitEnum|null
    {
        return AdminNavigationGroup::UsersAndFans;
    }

    public static function form(Schema $schema): Schema
    {
        return ReferralForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return ReferralsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function canViewAny(): bool
    {
        return static::adminCan(AdminPermission::ReferralsView);
    }

    public static function canCreate(): bool
    {
        return static::adminCan(AdminPermission::ReferralsView);
    }

    public static function canEdit($record): bool
    {
        return static::adminCan(AdminPermission::ReferralsView);
    }

    public static function canDelete($record): bool
    {
        return static::adminCan(AdminPermission::ReferralsView);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListReferrals::route('/'),
            'create' => CreateReferral::route('/create'),
            'edit' => EditReferral::route('/{record}/edit'),
        ];
    }
}
