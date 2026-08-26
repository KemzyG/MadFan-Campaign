<?php

namespace App\Filament\Resources\MatchFixtures;

use App\Enums\AdminPermission;
use App\Filament\Concerns\AuthorizesFilamentResources;
use App\Filament\Navigation\AdminNavigationGroup;
use App\Filament\Resources\MatchFixtures\Pages\CreateMatchFixture;
use App\Filament\Resources\MatchFixtures\Pages\EditMatchFixture;
use App\Filament\Resources\MatchFixtures\Pages\ListMatchFixtures;
use App\Filament\Resources\MatchFixtures\Schemas\MatchFixtureForm;
use App\Filament\Resources\MatchFixtures\Tables\MatchFixturesTable;
use App\Models\MatchFixture;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class MatchFixtureResource extends Resource
{
    use AuthorizesFilamentResources;

    protected static ?string $model = MatchFixture::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedCalendarDays;

    protected static ?string $navigationLabel = 'Fixtures';

    public static function getNavigationGroup(): string|UnitEnum|null
    {
        return AdminNavigationGroup::Campaigns;
    }

    public static function form(Schema $schema): Schema
    {
        return MatchFixtureForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return MatchFixturesTable::configure($table);
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
            'index' => ListMatchFixtures::route('/'),
            'create' => CreateMatchFixture::route('/create'),
            'edit' => EditMatchFixture::route('/{record}/edit'),
        ];
    }
}
