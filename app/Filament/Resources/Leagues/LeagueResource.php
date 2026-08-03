<?php

namespace App\Filament\Resources\Leagues;

use App\Enums\AdminPermission;
use App\Filament\Concerns\AuthorizesFilamentResources;
use App\Filament\Navigation\AdminNavigationGroup;
use App\Filament\Resources\Leagues\Pages\CreateLeague;
use App\Filament\Resources\Leagues\Pages\EditLeague;
use App\Filament\Resources\Leagues\Pages\ListLeagues;
use App\Filament\Resources\Leagues\Schemas\LeagueForm;
use App\Filament\Resources\Leagues\Tables\LeaguesTable;
use App\Models\League;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class LeagueResource extends Resource
{
    use AuthorizesFilamentResources;

    protected static ?string $model = League::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedTrophy;

    protected static ?string $recordTitleAttribute = 'name';

    protected static ?int $navigationSort = 3;

    public static function getNavigationGroup(): string|UnitEnum|null
    {
        return AdminNavigationGroup::Campaigns;
    }

    public static function form(Schema $schema): Schema
    {
        return LeagueForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return LeaguesTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function canViewAny(): bool
    {
        return static::adminCan(AdminPermission::LeaguesManage);
    }

    public static function canCreate(): bool
    {
        return static::adminCan(AdminPermission::LeaguesManage);
    }

    public static function canEdit($record): bool
    {
        return static::adminCan(AdminPermission::LeaguesManage);
    }

    public static function canDelete($record): bool
    {
        return static::adminCan(AdminPermission::LeaguesManage);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListLeagues::route('/'),
            'create' => CreateLeague::route('/create'),
            'edit' => EditLeague::route('/{record}/edit'),
        ];
    }
}
