<?php

namespace App\Filament\Resources\Jerseys;

use App\Enums\AdminPermission;
use App\Filament\Concerns\AuthorizesFilamentResources;
use App\Filament\Navigation\AdminNavigationGroup;
use App\Filament\Resources\Jerseys\Pages\CreateJersey;
use App\Filament\Resources\Jerseys\Pages\EditJersey;
use App\Filament\Resources\Jerseys\Pages\ListJerseys;
use App\Filament\Resources\Jerseys\Schemas\JerseyForm;
use App\Filament\Resources\Jerseys\Tables\JerseysTable;
use App\Models\Jersey;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use UnitEnum;

class JerseyResource extends Resource
{
    use AuthorizesFilamentResources;

    protected static ?string $model = Jersey::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedShoppingBag;

    protected static ?string $recordTitleAttribute = 'name';

    protected static ?int $navigationSort = 5;

    public static function getNavigationGroup(): string|UnitEnum|null
    {
        return AdminNavigationGroup::Campaigns;
    }

    public static function form(Schema $schema): Schema
    {
        return JerseyForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return JerseysTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->with(['club', 'variants']);
    }

    public static function canViewAny(): bool
    {
        return static::adminCan(AdminPermission::JerseysManage);
    }

    public static function canCreate(): bool
    {
        return static::adminCan(AdminPermission::JerseysManage);
    }

    public static function canEdit($record): bool
    {
        return static::adminCan(AdminPermission::JerseysManage);
    }

    public static function canDelete($record): bool
    {
        return static::adminCan(AdminPermission::JerseysManage);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListJerseys::route('/'),
            'create' => CreateJersey::route('/create'),
            'edit' => EditJersey::route('/{record}/edit'),
        ];
    }
}
