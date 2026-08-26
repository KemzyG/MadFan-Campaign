<?php

namespace App\Filament\Resources\Polls;

use App\Enums\AdminPermission;
use App\Filament\Concerns\AuthorizesFilamentResources;
use App\Filament\Navigation\AdminNavigationGroup;
use App\Filament\Resources\Polls\Pages\CreatePoll;
use App\Filament\Resources\Polls\Pages\EditPoll;
use App\Filament\Resources\Polls\Pages\ListPolls;
use App\Filament\Resources\Polls\Schemas\PollForm;
use App\Filament\Resources\Polls\Tables\PollsTable;
use App\Models\Poll;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use UnitEnum;

class PollResource extends Resource
{
    use AuthorizesFilamentResources;

    protected static ?string $model = Poll::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedChartBar;

    public static function getNavigationGroup(): string|UnitEnum|null
    {
        return AdminNavigationGroup::Campaigns;
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->withCount('options');
    }

    public static function form(Schema $schema): Schema
    {
        return PollForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return PollsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function canViewAny(): bool
    {
        return static::adminCan(AdminPermission::TasksManage);
    }

    public static function canCreate(): bool
    {
        return static::adminCan(AdminPermission::TasksManage);
    }

    public static function canEdit($record): bool
    {
        return static::adminCan(AdminPermission::TasksManage);
    }

    public static function canDelete($record): bool
    {
        return static::adminCan(AdminPermission::TasksManage);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListPolls::route('/'),
            'create' => CreatePoll::route('/create'),
            'edit' => EditPoll::route('/{record}/edit'),
        ];
    }
}
