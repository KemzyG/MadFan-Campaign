<?php

namespace App\Filament\Resources\PointTransactions;

use App\Enums\AdminPermission;
use App\Filament\Concerns\AuthorizesFilamentResources;
use App\Filament\Navigation\AdminNavigationGroup;
use App\Filament\Resources\PointTransactions\Pages\CreatePointTransaction;
use App\Filament\Resources\PointTransactions\Pages\EditPointTransaction;
use App\Filament\Resources\PointTransactions\Pages\ListPointTransactions;
use App\Filament\Resources\PointTransactions\Schemas\PointTransactionForm;
use App\Filament\Resources\PointTransactions\Tables\PointTransactionsTable;
use App\Models\PointTransaction;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class PointTransactionResource extends Resource
{
    use AuthorizesFilamentResources;

    protected static ?string $model = PointTransaction::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedTicket;

    protected static ?int $navigationSort = 4;

    public static function getNavigationGroup(): string|UnitEnum|null
    {
        return AdminNavigationGroup::LoyaltyAndRewards;
    }

    public static function form(Schema $schema): Schema
    {
        return PointTransactionForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return PointTransactionsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function canViewAny(): bool
    {
        return static::adminCan(AdminPermission::PointTransactionsView);
    }

    public static function canCreate(): bool
    {
        return false;
    }

    public static function canEdit($record): bool
    {
        return false;
    }

    public static function canDelete($record): bool
    {
        return false;
    }

    public static function getPages(): array
    {
        return [
            'index' => ListPointTransactions::route('/'),
            'create' => CreatePointTransaction::route('/create'),
            'edit' => EditPointTransaction::route('/{record}/edit'),
        ];
    }
}
