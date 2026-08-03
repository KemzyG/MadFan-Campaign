<?php

namespace App\Filament\Pages;

use App\Filament\Navigation\AdminNavigationGroup;
use App\Models\User;
use BackedEnum;
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Support\Icons\Heroicon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use UnitEnum;

class SystemLogs extends Page
{
    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedCommandLine;

    protected static ?int $navigationSort = 2;

    public static function getNavigationGroup(): string|UnitEnum|null
    {
        return AdminNavigationGroup::SystemAndAudit;
    }

    protected string $view = 'filament.pages.system-logs';

    public ?string $logContent = null;

    public function mount(): void
    {
        $this->loadLogs();
    }

    public function loadLogs(): void
    {
        $logPath = storage_path('logs/laravel.log');

        if (! File::exists($logPath)) {
            $this->logContent = 'Log file does not exist yet.';

            return;
        }

        // Get last 500 lines of log file
        $content = File::get($logPath);
        $lines = explode("\n", $content);
        $lastLines = array_slice($lines, -500);
        $this->logContent = implode("\n", $lastLines);
    }

    protected function getHeaderActions(): array
    {
        return [
            Action::make('migrate')
                ->label('Run migrations')
                ->icon(Heroicon::OutlinedCircleStack)
                ->color('warning')
                ->visible(fn (): bool => auth()->user() instanceof User && auth()->user()->hasRole('super-admin'))
                ->requiresConfirmation()
                ->modalHeading('Run database migrations?')
                ->modalDescription('This runs `php artisan migrate --force` on the live database. Only use after deploying new migration files.')
                ->action(function (): void {
                    $exitCode = Artisan::call('migrate', ['--force' => true]);
                    $output = trim(Artisan::output());

                    if ($exitCode === 0) {
                        Notification::make()
                            ->title('Migrations completed')
                            ->body($output !== '' ? $output : 'Nothing to migrate.')
                            ->success()
                            ->send();

                        return;
                    }

                    Notification::make()
                        ->title('Migration failed')
                        ->body($output !== '' ? $output : 'Artisan exited with code '.$exitCode)
                        ->danger()
                        ->send();
                }),
            Action::make('refresh')
                ->label('Refresh')
                ->color('gray')
                ->action(function () {
                    $this->loadLogs();
                    Notification::make()
                        ->title('Logs refreshed')
                        ->success()
                        ->send();
                }),
            Action::make('clear')
                ->label('Clear Logs')
                ->color('danger')
                ->requiresConfirmation()
                ->action(function () {
                    $logPath = storage_path('logs/laravel.log');
                    if (File::exists($logPath)) {
                        File::put($logPath, '');
                    }
                    $this->loadLogs();
                    Notification::make()
                        ->title('Logs cleared successfully')
                        ->success()
                        ->send();
                }),
        ];
    }
}
