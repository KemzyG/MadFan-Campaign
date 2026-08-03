<?php

namespace App\Filament\Resources\Clubs;

use App\Enums\AdminPermission;
use App\Filament\Concerns\AuthorizesFilamentResources;
use App\Filament\Navigation\AdminNavigationGroup;
use App\Filament\Resources\Clubs\Pages\CreateClub;
use App\Filament\Resources\Clubs\Pages\EditClub;
use App\Filament\Resources\Clubs\Pages\ListClubs;
use App\Filament\Resources\Clubs\Schemas\ClubForm;
use App\Filament\Resources\Clubs\Tables\ClubsTable;
use App\Models\Club;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class ClubResource extends Resource
{
    use AuthorizesFilamentResources;

    protected static ?string $model = Club::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedBuildingLibrary;

    protected static ?string $recordTitleAttribute = 'name';

    protected static ?int $navigationSort = 4;

    public static function getNavigationGroup(): string|UnitEnum|null
    {
        return AdminNavigationGroup::Campaigns;
    }

    public static function form(Schema $schema): Schema
    {
        return ClubForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return ClubsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function canViewAny(): bool
    {
        return static::adminCan(AdminPermission::ClubsManage);
    }

    public static function canCreate(): bool
    {
        return static::adminCan(AdminPermission::ClubsManage);
    }

    public static function canEdit($record): bool
    {
        return static::adminCan(AdminPermission::ClubsManage);
    }

    public static function canDelete($record): bool
    {
        return static::adminCan(AdminPermission::ClubsManage);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListClubs::route('/'),
            'create' => CreateClub::route('/create'),
            'edit' => EditClub::route('/{record}/edit'),
        ];
    }
}
