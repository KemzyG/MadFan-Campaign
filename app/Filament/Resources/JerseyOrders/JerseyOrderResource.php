<?php

namespace App\Filament\Resources\JerseyOrders;

use App\Enums\AdminPermission;
use App\Filament\Concerns\AuthorizesFilamentResources;
use App\Filament\Navigation\AdminNavigationGroup;
use App\Filament\Resources\JerseyOrders\Pages\EditJerseyOrder;
use App\Filament\Resources\JerseyOrders\Pages\ListJerseyOrders;
use App\Filament\Resources\JerseyOrders\Schemas\JerseyOrderForm;
use App\Filament\Resources\JerseyOrders\Tables\JerseyOrdersTable;
use App\Models\JerseyOrder;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class JerseyOrderResource extends Resource
{
    use AuthorizesFilamentResources;

    protected static ?string $model = JerseyOrder::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedClipboardDocumentList;

    protected static ?string $recordTitleAttribute = 'code';

    protected static ?string $navigationLabel = 'Jersey orders';

    protected static ?int $navigationSort = 6;

    public static function getNavigationGroup(): string|UnitEnum|null
    {
        return AdminNavigationGroup::Campaigns;
    }

    public static function form(Schema $schema): Schema
    {
        return JerseyOrderForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return JerseyOrdersTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function canViewAny(): bool
    {
        return static::adminCan(AdminPermission::JerseyOrdersView);
    }

    public static function canCreate(): bool
    {
        return false;
    }

    public static function canEdit($record): bool
    {
        return static::adminCan(AdminPermission::JerseyOrdersManage);
    }

    public static function canDelete($record): bool
    {
        return false;
    }

    public static function getPages(): array
    {
        return [
            'index' => ListJerseyOrders::route('/'),
            'edit' => EditJerseyOrder::route('/{record}/edit'),
        ];
    }
}
