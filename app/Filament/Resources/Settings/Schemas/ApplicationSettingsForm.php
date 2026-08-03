<?php

namespace App\Filament\Resources\Settings\Schemas;

use App\Support\ApplicationSettings;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Schema;

class ApplicationSettingsForm
{
    public static function configure(Schema $schema): Schema
    {
        $definitions = ApplicationSettings::definitions();
        $sectionLabels = ApplicationSettings::sectionLabels();

        $tabs = [];

        foreach (ApplicationSettings::segments() as $segment) {
            $sections = [];

            foreach ($segment['sections'] as $sectionKey) {
                $fields = self::fieldsForSection($sectionKey, $definitions);

                if ($fields === []) {
                    continue;
                }

                $sections[] = Section::make($sectionLabels[$sectionKey] ?? $sectionKey)
                    ->schema($fields)
                    ->columns(2);
            }

            $tabs[] = Tab::make($segment['label'])
                ->icon($segment['icon'])
                ->schema($sections);
        }

        return $schema
            ->columns(1)
            ->components([
                Tabs::make('Settings')
                    ->tabs($tabs)
                    ->columnSpanFull(),
            ]);
    }

    /**
     * @param  array<string, array{label: string, description: string, type: string, section: string, options?: array<string, string>}>  $definitions
     * @return array<int, Toggle|TextInput|Select>
     */
    private static function fieldsForSection(string $sectionKey, array $definitions): array
    {
        $fields = [];

        foreach ($definitions as $key => $definition) {
            if ($definition['section'] !== $sectionKey) {
                continue;
            }

            $fields[] = self::fieldComponent($key, $definition);
        }

        return $fields;
    }

    /**
     * @param  array{label: string, description: string, type: string, section: string, options?: array<string, string>}  $definition
     */
    private static function fieldComponent(string $key, array $definition): Toggle|TextInput|Select
    {
        return match ($definition['type']) {
            'boolean' => self::booleanToggle($key, $definition),
            'select' => Select::make($key)
                ->label($definition['label'])
                ->helperText($definition['description'])
                ->options($definition['options'] ?? []),
            'password' => TextInput::make($key)
                ->label($definition['label'])
                ->helperText($definition['description'])
                ->password()
                ->revealable()
                ->dehydrated(fn (?string $state): bool => filled($state))
                ->columnSpanFull(),
            'integer' => TextInput::make($key)
                ->label($definition['label'])
                ->helperText($definition['description'])
                ->numeric()
                ->minValue(0),
            'email' => TextInput::make($key)
                ->label($definition['label'])
                ->helperText($definition['description'])
                ->email(),
            default => TextInput::make($key)
                ->label($definition['label'])
                ->helperText($definition['description'])
                ->maxLength(500),
        };
    }

    /**
     * @param  array{label: string, description: string, type: string, section: string}  $definition
     */
    private static function booleanToggle(string $key, array $definition): Toggle
    {
        return Toggle::make($key)
            ->label($definition['label'])
            ->helperText($definition['description']);
    }
}
