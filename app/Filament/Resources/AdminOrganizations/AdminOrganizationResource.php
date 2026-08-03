<?php

namespace App\Filament\Resources\AdminOrganizations;

use App\Filament\Navigation\AdminNavigationGroup;
use App\Filament\Resources\AdminOrganizations\Pages\CreateAdminOrganization;
use App\Filament\Resources\AdminOrganizations\Pages\EditAdminOrganization;
use App\Filament\Resources\AdminOrganizations\Pages\ListAdminOrganizations;
use App\Filament\Resources\AdminOrganizations\Schemas\AdminOrganizationForm;
use App\Filament\Resources\AdminOrganizations\Tables\AdminOrganizationsTable;
use App\Models\AdminOrganization;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class AdminOrganizationResource extends Resource
{
    protected static ?string $model = AdminOrganization::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedBuildingOffice2;

    protected static ?string $navigationLabel = 'Operator Organizations';

    protected static ?int $navigationSort = 2;

    public static function getNavigationGroup(): string|UnitEnum|null
    {
        return AdminNavigationGroup::AccessControl;
    }

    public static function form(Schema $schema): Schema
    {
        return AdminOrganizationForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return AdminOrganizationsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListAdminOrganizations::route('/'),
            'create' => CreateAdminOrganization::route('/create'),
            'edit' => EditAdminOrganization::route('/{record}/edit'),
        ];
    }
}
