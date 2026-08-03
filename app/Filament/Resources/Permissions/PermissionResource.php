<?php

namespace App\Filament\Resources\Permissions;

use App\Enums\AdminPermission;
use App\Filament\Concerns\AuthorizesFilamentResources;
use App\Filament\Navigation\AdminNavigationGroup;
use App\Filament\Resources\Permissions\Pages\CreatePermission;
use App\Filament\Resources\Permissions\Pages\EditPermission;
use App\Filament\Resources\Permissions\Pages\ListPermissions;
use BackedEnum;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Spatie\Permission\Models\Permission;
use UnitEnum;

class PermissionResource extends Resource
{
    use AuthorizesFilamentResources;

    protected static ?string $model = Permission::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedKey;

    protected static ?int $navigationSort = 2;

    public static function getNavigationGroup(): string|UnitEnum|null
    {
        return AdminNavigationGroup::AccessControl;
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            TextInput::make('name')
                ->required()
                ->unique(ignoreRecord: true)
                ->maxLength(255)
                ->helperText('Use dot notation e.g. users.create, tasks.edit'),

            Select::make('guard_name')
                ->options([
                    'web' => 'Web',
                    'api' => 'API',
                ])
                ->default('web')
                ->required(),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('id')
                    ->sortable()
                    ->label('ID'),

                TextColumn::make('name')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('guard_name')
                    ->badge()
                    ->searchable(),

                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function canViewAny(): bool
    {
        return static::adminCan(AdminPermission::RolesManage);
    }

    public static function canCreate(): bool
    {
        return static::adminCan(AdminPermission::RolesManage);
    }

    public static function canEdit($record): bool
    {
        return static::adminCan(AdminPermission::RolesManage);
    }

    public static function canDelete($record): bool
    {
        return static::adminCan(AdminPermission::RolesManage);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListPermissions::route('/'),
            'create' => CreatePermission::route('/create'),
            'edit' => EditPermission::route('/{record}/edit'),
        ];
    }
}
