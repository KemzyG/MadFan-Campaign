<?php

namespace App\Filament\Resources\Roles;

use App\Enums\AdminPermission;
use App\Filament\Concerns\AuthorizesFilamentResources;
use App\Filament\Navigation\AdminNavigationGroup;
use App\Filament\Resources\Roles\Pages\CreateRole;
use App\Filament\Resources\Roles\Pages\EditRole;
use App\Filament\Resources\Roles\Pages\ListRoles;
use App\Models\Role;
use BackedEnum;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\CheckboxList;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use UnitEnum;

class RoleResource extends Resource
{
    use AuthorizesFilamentResources;

    protected static ?string $model = Role::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedShieldCheck;

    protected static ?int $navigationSort = 1;

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
                ->maxLength(255),

            Select::make('guard_name')
                ->options([
                    'web' => 'Web',
                    'api' => 'API',
                ])
                ->default('web')
                ->required(),

            CheckboxList::make('permissions')
                ->relationship('permissions', 'name')
                ->searchable()
                ->bulkToggleable()
                ->columns(3)
                ->gridDirection('row'),
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

                TextColumn::make('permissions_count')
                    ->counts('permissions')
                    ->label('Permissions')
                    ->sortable(),

                TextColumn::make('users_count')
                    ->counts('users')
                    ->label('Users')
                    ->sortable(),

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
        return static::adminCan(AdminPermission::RolesView);
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
            'index' => ListRoles::route('/'),
            'create' => CreateRole::route('/create'),
            'edit' => EditRole::route('/{record}/edit'),
        ];
    }
}
