<?php

namespace App\Filament\Resources\Settings\Pages;

use App\Filament\Resources\Settings\Schemas\ApplicationSettingsForm;
use App\Filament\Resources\Settings\SettingResource;
use App\Models\ActivityLog;
use App\Support\ApplicationSettings;
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Filament\Pages\Concerns\InteractsWithFormActions;
use Filament\Resources\Pages\Page;
use Filament\Schemas\Components\Actions;
use Filament\Schemas\Components\Component;
use Filament\Schemas\Components\EmbeddedSchema;
use Filament\Schemas\Components\Form;
use Filament\Schemas\Schema;
use Filament\Support\Facades\FilamentView;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * @property-read Schema $form
 */
class ManageSettings extends Page
{
    use InteractsWithFormActions;

    protected static string $resource = SettingResource::class;

    protected static ?string $title = 'Application Settings';

    /**
     * @var array<string, mixed>|null
     */
    public ?array $data = [];

    public function mount(): void
    {
        $this->fillForm();
    }

    protected function fillForm(): void
    {
        $values = ApplicationSettings::values();

        foreach (ApplicationSettings::definitions() as $key => $definition) {
            if ($definition['type'] === 'boolean') {
                $values[$key] = filter_var($values[$key], FILTER_VALIDATE_BOOLEAN);
            }
        }

        $this->form->fill($values);
    }

    public function save(): void
    {
        try {
            $payload = ApplicationSettings::validatePayload($this->resolveSettingsPayload());

            ApplicationSettings::sync($payload);

            ActivityLog::record('settings.updated', 'Admin updated application settings');

            Notification::make()
                ->title('Settings saved')
                ->success()
                ->send();
        } catch (ValidationException $exception) {
            Notification::make()
                ->title('Settings could not be saved')
                ->body(collect($exception->errors())->flatten()->first() ?? 'Please review the highlighted fields.')
                ->danger()
                ->send();

            throw $exception;
        } catch (Throwable $exception) {
            Notification::make()
                ->title('Settings could not be saved')
                ->body($exception->getMessage())
                ->danger()
                ->send();

            throw $exception;
        }

        $this->fillForm();

        if ($redirectUrl = $this->getRedirectUrl()) {
            $this->redirect($redirectUrl, navigate: FilamentView::hasSpaMode($redirectUrl));
        }
    }

    /**
     * @return array<string, mixed>
     */
    protected function resolveSettingsPayload(): array
    {
        $payload = is_array($this->data) ? $this->data : [];

        unset($payload['mail_password']);

        $stored = ApplicationSettings::values();
        unset($stored['mail_password']);

        return array_merge($stored, $payload);
    }

    public function defaultForm(Schema $schema): Schema
    {
        return $schema
            ->statePath('data');
    }

    public function form(Schema $schema): Schema
    {
        return ApplicationSettingsForm::configure($schema);
    }

    /**
     * @return array<Action>
     */
    protected function getFormActions(): array
    {
        return [
            $this->getSaveFormAction(),
        ];
    }

    protected function getSaveFormAction(): Action
    {
        return Action::make('save')
            ->label('Save settings')
            ->submit('save')
            ->keyBindings(['mod+s']);
    }

    public function getSubheading(): ?string
    {
        return 'Manage general, email, social, and system configuration from segmented tabs.';
    }

    public function content(Schema $schema): Schema
    {
        return $schema
            ->components([
                $this->getFormContentComponent(),
            ]);
    }

    public function getFormContentComponent(): Component
    {
        return Form::make([EmbeddedSchema::make('form')])
            ->id('settings-form')
            ->livewireSubmitHandler('save')
            ->footer([
                Actions::make($this->getFormActions())
                    ->alignment($this->getFormActionsAlignment())
                    ->fullWidth($this->hasFullWidthFormActions())
                    ->sticky($this->areFormActionsSticky())
                    ->key('settings-form-actions'),
            ]);
    }

    protected function getRedirectUrl(): ?string
    {
        return null;
    }
}
