<?php

namespace App\Filament\Resources\Admins;

use App\Enums\AdminPermission;
use App\Filament\Concerns\AuthorizesFilamentResources;
use App\Filament\Navigation\AdminNavigationGroup;
use App\Filament\Resources\Admins\Pages\CreateAdmin;
use App\Filament\Resources\Admins\Pages\EditAdmin;
use App\Filament\Resources\Admins\Pages\ListAdmins;
use App\Models\User;
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
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Auth\Access\Response;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\Rules\Password;
use UnitEnum;

class AdminResource extends Resource
{
    use AuthorizesFilamentResources;

    protected static ?string $model = User::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedUserGroup;

    protected static ?string $modelLabel = 'Admin';

    protected static ?string $pluralModelLabel = 'Admins';

    protected static ?string $slug = 'admins';

    protected static ?int $navigationSort = 3;

    public static function getNavigationGroup(): string|UnitEnum|null
    {
        return AdminNavigationGroup::AccessControl;
    }

    /** Scope to Inertia console operators only (super-admin is managed separately). */
    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->role(User::INERTIA_ADMIN_ROLES);
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            TextInput::make('name')
                ->required()
                ->maxLength(255),

            TextInput::make('email')
                ->email()
                ->required()
                ->unique(table: User::class, ignoreRecord: true)
                ->maxLength(255),

            TextInput::make('password')
                ->password()
                ->revealable()
                ->rule(Password::defaults())
                ->dehydrated(fn (?string $state): bool => filled($state))
                ->required(fn (string $operation): bool => $operation === 'create')
                ->helperText('Leave blank to keep existing password when editing.'),

            Select::make('roles')
                ->relationship(
                    name: 'roles',
                    titleAttribute: 'name',
                    modifyQueryUsing: fn (Builder $query): Builder => $query->whereIn('name', User::INERTIA_ADMIN_ROLES),
                )
                ->getOptionLabelFromRecordUsing(fn (Model $record): string => match ($record->name) {
                    'admin' => 'Admin',
                    'support' => 'Support',
                    'management' => 'Management',
                    default => (string) $record->name,
                })
                ->multiple()
                ->required()
                ->preload(),

            Select::make('adminOrganizations')
                ->relationship('adminOrganizations', 'name')
                ->label('Operator organizations')
                ->multiple()
                ->required()
                ->preload()
                ->helperText('Determines which fan partitions this operator can see in the Inertia console.'),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('email')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('roles.name')
                    ->badge()
                    ->label('Roles'),

                TextColumn::make('adminOrganizations.name')
                    ->badge()
                    ->label('Organizations'),

                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('last_login_at')
                    ->dateTime()
                    ->sortable()
                    ->label('Last Login')
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('roles')
                    ->relationship('roles', 'name')
                    ->multiple()
                    ->preload()
                    ->label('Role'),
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getViewAnyAuthorizationResponse(): Response
    {
        return static::adminAuthorizationResponse(AdminPermission::AdminsView);
    }

    public static function getViewAuthorizationResponse(Model $record): Response
    {
        return static::adminAuthorizationResponse(AdminPermission::AdminsView);
    }

    public static function getCreateAuthorizationResponse(): Response
    {
        return static::adminAuthorizationResponse(AdminPermission::AdminsManage);
    }

    public static function getEditAuthorizationResponse(Model $record): Response
    {
        return static::adminAuthorizationResponse(AdminPermission::AdminsManage);
    }

    public static function getDeleteAuthorizationResponse(Model $record): Response
    {
        return static::adminAuthorizationResponse(AdminPermission::AdminsManage);
    }

    public static function getDeleteAnyAuthorizationResponse(): Response
    {
        return static::adminAuthorizationResponse(AdminPermission::AdminsManage);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListAdmins::route('/'),
            'create' => CreateAdmin::route('/create'),
            'edit' => EditAdmin::route('/{record}/edit'),
        ];
    }
}
