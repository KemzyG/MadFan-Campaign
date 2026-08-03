<?php

namespace App\Providers\Filament;

use App\Filament\Navigation\AdminNavigationGroup;
use App\Filament\Widgets\PointsChart;
use App\Filament\Widgets\StatsOverview;
use App\Http\Middleware\EnsureAdminMfaPassed;
use App\Support\AdminRouting;
use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Panel;
use Filament\PanelProvider;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        $panel = $panel
            ->default()
            ->id('admin')
            ->path(AdminRouting::filamentPath())
            ->login()
            ->favicon(asset('favicon.jpg'))
            ->colors([
                'primary' => [
                    50 => '#fefff0',
                    100 => '#fcffe0',
                    200 => '#f7ffb0',
                    300 => '#f0ff70',
                    400 => '#ecff40',
                    500 => '#e8ff00',
                    600 => '#c4d900',
                    700 => '#9aab00',
                    800 => '#717d00',
                    900 => '#4a5200',
                    950 => '#2a3000',
                ],
            ])
            ->navigationGroups(AdminNavigationGroup::class)
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\Filament\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\Filament\Pages')
            ->pages([

            ])
            ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'App\Filament\Widgets')
            ->widgets([
                StatsOverview::class,
                PointsChart::class,
            ])
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                PreventRequestForgery::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                Authenticate::class,
                EnsureAdminMfaPassed::class,
            ]);

        $domain = AdminRouting::filamentDomain();

        if ($domain !== null) {
            $panel->domain($domain);
        }

        return $panel;
    }
}
