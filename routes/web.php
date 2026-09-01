<?php

use App\Http\Controllers\Admin\ActivityLogsController;
use App\Http\Controllers\Admin\AdminsController;
use App\Http\Controllers\Admin\AnnouncementsController;
use App\Http\Controllers\Admin\ChannelsController;
use App\Http\Controllers\Admin\ClubsController;
use App\Http\Controllers\Admin\DashboardController as AdminApiDashboardController;
use App\Http\Controllers\Admin\FandomsController;
use App\Http\Controllers\Admin\FandomSubsetsController;
use App\Http\Controllers\Admin\FixturesController;
use App\Http\Controllers\Admin\HighlightsController;
use App\Http\Controllers\Admin\JerseyOrdersController;
use App\Http\Controllers\Admin\JerseysController;
use App\Http\Controllers\Admin\LeaguesController;
use App\Http\Controllers\Admin\LoyaltyTiersController;
use App\Http\Controllers\Admin\MediaAssetsController;
use App\Http\Controllers\Admin\PointTransactionsController;
use App\Http\Controllers\Admin\PollsController;
use App\Http\Controllers\Admin\PostsController;
use App\Http\Controllers\Admin\PredictionsController;
use App\Http\Controllers\Admin\ReferralsController;
use App\Http\Controllers\Admin\ReportsController;
use App\Http\Controllers\Admin\RolesController;
use App\Http\Controllers\Admin\SeasonsController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\ShowdownsController;
use App\Http\Controllers\Admin\StaffAssignmentsController;
use App\Http\Controllers\Admin\StaffMembersController;
use App\Http\Controllers\Admin\StagesController;
use App\Http\Controllers\Admin\SystemLogsController;
use App\Http\Controllers\Admin\TaskReviewsController;
use App\Http\Controllers\Admin\TasksController;
use App\Http\Controllers\Admin\UsersController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\Auth\AdminMfaController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\FanLoginController;
use App\Http\Controllers\Auth\FanRegisterController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\Inertia\ActivityLogsPageController;
use App\Http\Controllers\Inertia\AdminOrganizationSwitchController;
use App\Http\Controllers\Inertia\AdminProfilePageController;
use App\Http\Controllers\Inertia\AdminsPageController;
use App\Http\Controllers\Inertia\AnnouncementsPageController;
use App\Http\Controllers\Inertia\ChannelsPageController;
use App\Http\Controllers\Inertia\ClubsPageController;
use App\Http\Controllers\Inertia\Fan\CampaignPageController;
use App\Http\Controllers\Inertia\Fan\ConnectAccountsPageController;
use App\Http\Controllers\Inertia\Fan\DailyClaimPageController;
use App\Http\Controllers\Inertia\Fan\DashboardPageController;
use App\Http\Controllers\Inertia\Fan\LandingPageController;
use App\Http\Controllers\Inertia\Fan\LegalPageController;
use App\Http\Controllers\Inertia\Fan\PassportPageController;
use App\Http\Controllers\Inertia\Fan\StaticPageController;
use App\Http\Controllers\Inertia\Fan\TasksPageController as FanTasksPageController;
use App\Http\Controllers\Inertia\FandomsPageController;
use App\Http\Controllers\Inertia\FixturesPageController;
use App\Http\Controllers\Inertia\HighlightsPageController;
use App\Http\Controllers\Inertia\ImpersonationController;
use App\Http\Controllers\Inertia\JerseyOrdersPageController;
use App\Http\Controllers\Inertia\JerseysPageController;
use App\Http\Controllers\Inertia\LeaderboardExportController;
use App\Http\Controllers\Inertia\LeaderboardPageController;
use App\Http\Controllers\Inertia\LeaguesPageController;
use App\Http\Controllers\Inertia\LivePageController;
use App\Http\Controllers\Inertia\LoyaltyTiersPageController;
use App\Http\Controllers\Inertia\MediaGalleryPageController;
use App\Http\Controllers\Inertia\MePageController;
use App\Http\Controllers\Inertia\PointTransactionsPageController;
use App\Http\Controllers\Inertia\PollsPageController;
use App\Http\Controllers\Inertia\PostsPageController;
use App\Http\Controllers\Inertia\PredictionsPageController;
use App\Http\Controllers\Inertia\ReferralsPageController;
use App\Http\Controllers\Inertia\ReportsPageController;
use App\Http\Controllers\Inertia\RolesPageController;
use App\Http\Controllers\Inertia\SeasonsPageController;
use App\Http\Controllers\Inertia\SettingsPageController;
use App\Http\Controllers\Inertia\ShowdownsPageController;
use App\Http\Controllers\Inertia\StaffPageController;
use App\Http\Controllers\Inertia\StagesPageController;
use App\Http\Controllers\Inertia\SystemLogsPageController;
use App\Http\Controllers\Inertia\TaskReviewsPageController;
use App\Http\Controllers\Inertia\TasksPageController;
use App\Http\Controllers\Inertia\UsersPageController;
use App\Http\Controllers\ReferralLandingController;
use App\Http\Controllers\SocialConnectController;
use App\Http\Controllers\TaskProofImageController;
use App\Models\Waitlist;
use App\Services\ReferralService;
use App\Support\AdminRouting;
use App\Support\ApplicationSettings;
use App\Support\CampaignRouting;
use App\Support\SocialRouting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// --------------------------------------------------------------------------
// Fan / campaign app (Inertia) — optional host via CAMPAIGN_DOMAIN
// --------------------------------------------------------------------------
$registerCampaignRoutes = function (): void {
    Route::get('/', LandingPageController::class)->name('fan.home');
    Route::get('/campaign', CampaignPageController::class)->name('fan.campaign');
    Route::get('/r/{fanId}', ReferralLandingController::class)->name('fan.referral');

    Route::redirect('/whitepaper', '/about')->name('fan.whitepaper');
    Route::get('/roadmap', fn () => app(StaticPageController::class)->show('roadmap'))->name('fan.roadmap');
    Route::get('/region', fn () => app(StaticPageController::class)->show('region'))->name('fan.region');
    Route::get('/team', fn () => app(StaticPageController::class)->show('team'))->name('fan.team');
    Route::get('/about', fn () => app(StaticPageController::class)->show('about'))->name('fan.about');
    Route::get('/community', fn () => app(StaticPageController::class)->show('community'))->name('fan.community');
    Route::get('/rewards', fn () => app(StaticPageController::class)->show('rewards'))->name('fan.rewards');
    Route::get('/privacy', fn () => app(LegalPageController::class)->show('privacy'))->name('fan.privacy');
    Route::get('/terms', fn () => app(LegalPageController::class)->show('terms'))->name('fan.terms');
    Route::get('/guidelines', fn () => app(LegalPageController::class)->show('guidelines'))->name('fan.guidelines');

    Route::middleware('app.maintenance')->group(function () {
        Route::middleware('guest')->group(function () {
            Route::get('/login', [FanLoginController::class, 'create'])->name('login');
            Route::post('/login', [FanLoginController::class, 'store'])->middleware('throttle:login');
            Route::post('/register', [FanRegisterController::class, 'store'])->middleware('throttle:register');

            Route::get('/forgot-password', [PasswordResetLinkController::class, 'create'])->name('password.request');
            Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])->middleware('throttle:login')->name('password.email');
            Route::get('/reset-password/{token}', [NewPasswordController::class, 'create'])->name('password.reset');
            Route::post('/reset-password', [NewPasswordController::class, 'store'])->middleware('throttle:login')->name('password.store');
        });

        Route::get('/register', [FanRegisterController::class, 'create'])->name('register');

        Route::post('/waitlist', function (Request $request, ReferralService $referralService) {
            $validated = $request->validate([
                'email' => ['required', 'email', 'max:255'],
                'full_name' => ['nullable', 'string', 'max:255'],
                'country' => ['nullable', 'string', 'max:255'],
                'club' => ['nullable', 'string', 'max:255'],
            ]);

            Waitlist::query()->firstOrCreate(
                ['email' => $validated['email']],
                [
                    'full_name' => $validated['full_name'] ?? explode('@', $validated['email'])[0],
                    'country' => $validated['country'] ?? '—',
                    'club' => $validated['club'] ?? '—',
                    'source' => $referralService->waitlistSource(),
                ],
            );

            $request->session()->put('waitlist_email', $validated['email']);

            $redirect = redirect()
                ->route('fan.campaign')
                ->with('success', 'You\'re on the waitlist!');

            if (ApplicationSettings::socialVerificationRequired()) {
                $redirect->with('open_onboarding', true);
            }

            return $redirect;
        })->middleware('throttle:waitlist')->name('fan.waitlist');

        Route::middleware('auth')->group(function () {
            Route::post('/logout', [FanLoginController::class, 'destroy'])->name('logout');
            Route::post('/impersonation/leave', [ImpersonationController::class, 'stop'])->name('impersonation.leave');

            Route::get('/email/verify', EmailVerificationPromptController::class)->name('verification.notice');
            Route::get('/email/verify/{id}/{hash}', VerifyEmailController::class)
                ->middleware(['signed', 'throttle:6,1'])
                ->name('verification.verify');
            Route::post('/email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
                ->middleware('throttle:6,1')
                ->name('verification.send');

            Route::get('/connect-accounts', [ConnectAccountsPageController::class, 'index'])->name('fan.connect-accounts');
            Route::post('/connect-accounts/verify', [SocialConnectController::class, 'verifyManual'])->name('fan.social.verify');
            Route::post('/connect-accounts/telegram', [SocialConnectController::class, 'telegramWidget'])->name('fan.social.telegram');
            Route::delete('/connect-accounts/{platform}', [SocialConnectController::class, 'disconnect'])->name('fan.social.disconnect');
            Route::get('/connect/{platform}', [SocialConnectController::class, 'redirect'])->name('fan.social.redirect');
            Route::get('/connect/{platform}/callback', [SocialConnectController::class, 'callback'])->name('fan.social.callback');

            Route::middleware(['verified', 'social.required'])->group(function () {
                Route::get('/dashboard', DashboardPageController::class)->name('fan.dashboard');

                Route::get('/daily-claim', [DailyClaimPageController::class, 'index'])->name('fan.daily-claim');
                Route::post('/daily-claim', [DailyClaimPageController::class, 'claim'])->name('fan.daily-claim.store');
                Route::post('/daily-claim/shootout', [DailyClaimPageController::class, 'shootoutWin'])
                    ->middleware('throttle:12,1')
                    ->name('fan.daily-claim.shootout');
                Route::post('/daily-claim/shootout/bulk', [DailyClaimPageController::class, 'shootoutBulk'])
                    ->middleware('throttle:30,1')
                    ->name('fan.daily-claim.shootout-bulk');
                Route::post('/daily-claim/shootout-loss', [DailyClaimPageController::class, 'shootoutLoss'])
                    ->middleware('throttle:60,1')
                    ->name('fan.daily-claim.shootout-loss');

                Route::get('/tasks', [FanTasksPageController::class, 'index'])->name('fan.tasks');
                Route::get('/tasks/{task}', [FanTasksPageController::class, 'show'])->name('fan.tasks.show');
                Route::post('/tasks/{task}/confirm', [FanTasksPageController::class, 'confirm'])->name('fan.tasks.confirm');
                Route::post('/tasks/{task}/claim', [FanTasksPageController::class, 'claim'])->name('fan.tasks.claim');
                Route::post('/tasks/{task}/complete', [FanTasksPageController::class, 'complete'])->name('fan.tasks.complete');

                Route::get('/passport', [PassportPageController::class, 'index'])->name('fan.passport');
                Route::patch('/passport', [PassportPageController::class, 'update'])
                    ->middleware('throttle:passport-update')
                    ->name('fan.passport.update');

                Route::middleware('staff.required')->group(function () {
                    Route::get('/staff', [App\Http\Controllers\Inertia\Fan\StaffPageController::class, 'index'])->name('fan.staff');
                });
            });

            Route::get('/media/task-proofs/{progress}', [TaskProofImageController::class, 'show'])
                ->name('task-proofs.show');
        });
    });

};

$registerSocialSurface = require __DIR__.'/social.php';

$mountSocial = function (string $pathPrefix, string $apiPrefix, bool $withNames) use ($registerSocialSurface): void {
    $registerSocialSurface($pathPrefix, $apiPrefix, $withNames);
};

$campaignDomain = CampaignRouting::domain();
$socialDomain = SocialRouting::domain();

if ($campaignDomain !== null) {
    Route::domain($campaignDomain)->group($registerCampaignRoutes);
} else {
    $registerCampaignRoutes();
}

if ($socialDomain !== null) {
    // Canonical clean URLs on the social host.
    Route::domain($socialDomain)->group(function () use ($mountSocial): void {
        $mountSocial('', 'api/social', true);
    });

    // Legacy /social/* paths still work on the social host (hard-coded frontend URLs).
    Route::domain($socialDomain)->group(function () use ($mountSocial): void {
        $mountSocial('social', 'api/social', false);
    });

    // Session actions the social SPA posts to on its own origin. The named
    // `logout` route stays on the campaign host (route('logout')); this unnamed
    // twin just lets social.<root>/logout resolve so the "Sign out" button isn't
    // a 404. The shared session cookie means logging out here logs out everywhere.
    Route::domain($socialDomain)
        ->middleware(['app.maintenance', 'auth'])
        ->group(function (): void {
            Route::post('/logout', [FanLoginController::class, 'destroy']);
        });

    // Guest auth twins so the fan can sign in on the social host itself — e.g.
    // after logout lands on social.<root>/login. The named routes (route('login'),
    // route('register'), route('password.*')) stay on the campaign host; these
    // unnamed twins just let the same forms resolve and POST same-origin here.
    Route::domain($socialDomain)
        ->middleware(['app.maintenance', 'guest'])
        ->group(function (): void {
            Route::get('/login', [FanLoginController::class, 'create']);
            Route::post('/login', [FanLoginController::class, 'store'])->middleware('throttle:login');
            Route::get('/register', [FanRegisterController::class, 'create']);
            Route::post('/register', [FanRegisterController::class, 'store'])->middleware('throttle:register');
            Route::get('/forgot-password', [PasswordResetLinkController::class, 'create']);
            Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])->middleware('throttle:login');
            Route::get('/reset-password/{token}', [NewPasswordController::class, 'create']);
            Route::post('/reset-password', [NewPasswordController::class, 'store'])->middleware('throttle:login');
        });

    // Old single-host bookmarks: /social/* → social subdomain clean URL.
    $legacySocialRedirect = function (): void {
        Route::any('/social/{path?}', function (?string $path = null) {
            $suffix = trim((string) $path, '/');

            return redirect()->away(SocialRouting::url($suffix === '' ? '/' : $suffix), 301);
        })->where('path', '.*')->name('social.legacy-redirect');
    };

    if ($campaignDomain !== null) {
        Route::domain($campaignDomain)->group($legacySocialRedirect);
    } else {
        $legacySocialRedirect();
    }
} else {
    // Single-host fallback (Render / local without subdomains).
    if ($campaignDomain !== null) {
        Route::domain($campaignDomain)->group(function () use ($mountSocial): void {
            $mountSocial('social', 'api/social', true);
        });
    } else {
        $mountSocial('social', 'api/social', true);
    }
}

// --------------------------------------------------------------------------
// Admin app (Inertia) — optional subdomain via ADMIN_DOMAIN / ADMIN_APP_DOMAIN
// --------------------------------------------------------------------------
if (AdminRouting::appPath() === 'ops' && AdminRouting::appDomain() === null) {
    Route::get('/app/{path?}', function (?string $path = null) {
        return redirect(AdminRouting::absoluteAppPath($path ?? ''));
    })->where('path', '.*');
}

$registerAdminRoutes = function (): void {
    $appPath = AdminRouting::appPath();
    $loginPath = AdminRouting::absoluteAppPath('login');
    $logoutPath = AdminRouting::absoluteAppPath('logout');

    Route::middleware('guest')->group(function () use ($loginPath) {
        Route::get($loginPath, [LoginController::class, 'create'])->name('admin.login');
        Route::post($loginPath, [LoginController::class, 'store'])->middleware('throttle:login');
    });

    Route::middleware(['auth', 'admin.mfa'])->group(function () use ($appPath) {
        Route::get($appPath.'/mfa/setup', [AdminMfaController::class, 'setup'])->name('admin.mfa.setup');
        Route::post($appPath.'/mfa/setup', [AdminMfaController::class, 'confirmSetup'])->middleware('throttle:login')->name('admin.mfa.setup.store');
        Route::get($appPath.'/mfa/challenge', [AdminMfaController::class, 'challenge'])->name('admin.mfa.challenge');
        Route::post($appPath.'/mfa/challenge', [AdminMfaController::class, 'verifyChallenge'])->middleware('throttle:login')->name('admin.mfa.challenge.store');
    });

    Route::middleware(['auth', 'admin.role', 'admin.org', 'admin.mfa'])
        ->prefix($appPath)
        ->name('admin.')
        ->group(function () {
            Route::get('/', AdminDashboardController::class)->name('dashboard');
            Route::get('/leaderboard', LeaderboardPageController::class)->name('leaderboard');
            Route::get('/leaderboard/export', LeaderboardExportController::class)->name('leaderboard.export');
            Route::get('/live', LivePageController::class)->name('live');
            Route::get('/me', MePageController::class)->name('me');

            Route::post('/organization', AdminOrganizationSwitchController::class)->name('organization.switch');

            Route::get('/users', [UsersPageController::class, 'index'])->name('users');
            Route::get('/users/{user}', [UsersPageController::class, 'show'])->name('users.show');
            Route::put('/users/{user}', [UsersPageController::class, 'update'])->name('users.update');
            Route::get('/staff', [StaffPageController::class, 'index'])->name('staff.index');
            Route::get('/staff/{user}', [StaffPageController::class, 'show'])->name('staff.show');
            Route::get('/admins', [AdminsPageController::class, 'index'])->name('admins');
            Route::get('/roles', [RolesPageController::class, 'index'])->name('roles');
            Route::post('/impersonate/{user}', [ImpersonationController::class, 'start'])->name('impersonate');
            Route::get('/tasks', [TasksPageController::class, 'index'])->name('tasks');
            Route::get('/task-reviews', [TaskReviewsPageController::class, 'index'])->name('task-reviews');
            Route::post('/task-reviews/{progress}/approve', [TaskReviewsPageController::class, 'approve'])->name('task-reviews.approve');
            Route::post('/task-reviews/{progress}/reject', [TaskReviewsPageController::class, 'reject'])->name('task-reviews.reject');
            Route::get('/media/task-proofs/{progress}', [TaskProofImageController::class, 'show'])
                ->name('task-proofs.show');
            Route::get('/failed-verifications', function () {
                return redirect()->route('admin.task-reviews', ['status' => 'rejected']);
            });
            Route::get('/seasons', [SeasonsPageController::class, 'index'])->name('seasons');
            Route::get('/loyalty-tiers', [LoyaltyTiersPageController::class, 'index'])->name('loyalty-tiers');
            Route::get('/fandoms', [FandomsPageController::class, 'index'])->name('fandoms');
            Route::get('/fandoms/{fandom}', [FandomsPageController::class, 'show'])->name('fandoms.show');
            Route::get('/leagues', [LeaguesPageController::class, 'index'])->name('leagues');
            Route::get('/clubs', [ClubsPageController::class, 'index'])->name('clubs');
            Route::get('/posts', [PostsPageController::class, 'index'])->name('posts');
            Route::get('/announcements', [AnnouncementsPageController::class, 'index'])->name('announcements');
            Route::get('/fixtures', [FixturesPageController::class, 'index'])->name('fixtures');
            Route::get('/reports', [ReportsPageController::class, 'index'])->name('reports');
            Route::get('/polls', [PollsPageController::class, 'index'])->name('polls');
            Route::get('/showdowns', [ShowdownsPageController::class, 'index'])->name('showdowns');
            Route::get('/predictions', [PredictionsPageController::class, 'index'])->name('predictions');
            Route::get('/stages', [StagesPageController::class, 'index'])->name('stages');
            Route::get('/channels', [ChannelsPageController::class, 'index'])->name('channels');
            Route::get('/highlights', [HighlightsPageController::class, 'index'])->name('highlights');
            Route::get('/jerseys', [JerseysPageController::class, 'index'])->name('jerseys');
            Route::get('/media', [MediaGalleryPageController::class, 'index'])->name('media');
            Route::get('/jersey-orders', [JerseyOrdersPageController::class, 'index'])->name('jersey-orders');
            Route::get('/referrals', [ReferralsPageController::class, 'index'])->name('referrals');
            Route::get('/point-transactions', [PointTransactionsPageController::class, 'index'])->name('point-transactions');
            Route::get('/activity-logs', [ActivityLogsPageController::class, 'index'])->name('activity-logs');
            Route::get('/settings', [SettingsPageController::class, 'index'])->name('settings');
            Route::put('/settings', [SettingsPageController::class, 'update'])->name('settings.update');
            Route::get('/profile', [AdminProfilePageController::class, 'edit'])->name('profile');
            Route::put('/profile', [AdminProfilePageController::class, 'update'])->name('profile.update');
            Route::get('/system-logs', [SystemLogsPageController::class, 'index'])->name('system-logs');

            Route::prefix('api')->name('api.')->middleware('throttle:admin-mutations')->group(function () {
                Route::get('/dashboard', AdminApiDashboardController::class)->name('dashboard');

                Route::apiResource('users', UsersController::class);
                Route::apiResource('admins', AdminsController::class);
                Route::apiResource('roles', RolesController::class);
                Route::post('users/{user}/assign-role', [UsersController::class, 'assignRole'])->name('users.assign-role');
                Route::get('staff-positions', [StaffAssignmentsController::class, 'positions'])->name('staff-positions.index');
                Route::apiResource('staff', StaffMembersController::class)->parameters(['staff' => 'user']);
                Route::post('users/{user}/staff-position', [StaffAssignmentsController::class, 'assign'])->name('users.staff-position.assign');
                Route::put('users/{user}/staff-position', [StaffAssignmentsController::class, 'update'])->name('users.staff-position.update');
                Route::delete('users/{user}/staff-position', [StaffAssignmentsController::class, 'destroy'])->name('users.staff-position.destroy');
                Route::get('users/{user}/staff-performance', [StaffAssignmentsController::class, 'performance'])->name('users.staff-performance');

                Route::apiResource('tasks', TasksController::class);
                Route::apiResource('seasons', SeasonsController::class);
                Route::apiResource('loyalty-tiers', LoyaltyTiersController::class);
                Route::apiResource('fandoms', FandomsController::class);
                Route::post('fandoms/{fandom}/subsets', [FandomSubsetsController::class, 'store'])->name('fandoms.subsets.store');
                Route::put('fandoms/{fandom}/subsets/{subset}', [FandomSubsetsController::class, 'update'])->name('fandoms.subsets.update');
                Route::delete('fandoms/{fandom}/subsets/{subset}', [FandomSubsetsController::class, 'destroy'])->name('fandoms.subsets.destroy');
                Route::apiResource('leagues', LeaguesController::class);
                Route::apiResource('clubs', ClubsController::class);
                Route::apiResource('posts', PostsController::class);
                Route::apiResource('announcements', AnnouncementsController::class);
                Route::apiResource('fixtures', FixturesController::class)->parameters(['fixtures' => 'fixture']);
                Route::apiResource('reports', ReportsController::class)->except(['store']);
                Route::apiResource('polls', PollsController::class);
                Route::apiResource('showdowns', ShowdownsController::class);
                Route::apiResource('predictions', PredictionsController::class);
                Route::apiResource('stages', StagesController::class);
                Route::apiResource('channels', ChannelsController::class);
                Route::apiResource('highlights', HighlightsController::class)->parameters(['highlights' => 'highlight']);
                Route::apiResource('jerseys', JerseysController::class);
                Route::get('media-assets', [MediaAssetsController::class, 'index'])->name('media-assets.index');
                Route::post('media-assets', [MediaAssetsController::class, 'store'])->name('media-assets.store');
                Route::post('media-assets/generate', [MediaAssetsController::class, 'generate'])->name('media-assets.generate');
                Route::get('media-assets/{mediaAsset}', [MediaAssetsController::class, 'show'])->name('media-assets.show');
                Route::put('media-assets/{mediaAsset}', [MediaAssetsController::class, 'update'])->name('media-assets.update');
                Route::delete('media-assets/{mediaAsset}', [MediaAssetsController::class, 'destroy'])->name('media-assets.destroy');
                Route::get('jersey-orders', [JerseyOrdersController::class, 'index'])->name('jersey-orders.index');
                Route::get('jersey-orders/{jerseyOrder}', [JerseyOrdersController::class, 'show'])->name('jersey-orders.show');
                Route::put('jersey-orders/{jerseyOrder}', [JerseyOrdersController::class, 'update'])->name('jersey-orders.update');

                Route::get('referrals', [ReferralsController::class, 'index'])->name('referrals.index');
                Route::patch('referrals/{referral}/status', [ReferralsController::class, 'updateStatus'])->name('referrals.status');

                Route::get('point-transactions', [PointTransactionsController::class, 'index'])->name('point-transactions.index');
                Route::get('activity-logs', [ActivityLogsController::class, 'index'])->name('activity-logs.index');
                Route::get('task-reviews', [TaskReviewsController::class, 'index'])->name('task-reviews.index');
                Route::post('task-reviews/{progress}/approve', [TaskReviewsController::class, 'approve'])->name('task-reviews.approve');
                Route::post('task-reviews/{progress}/reject', [TaskReviewsController::class, 'reject'])->name('task-reviews.reject');
                Route::get('failed-verifications', [TaskReviewsController::class, 'index'])->name('failed-verifications.index');

                Route::get('settings', [SettingsController::class, 'index'])->name('settings.index');
                Route::put('settings', [SettingsController::class, 'update'])->name('settings.update');
                Route::post('settings/single', [SettingsController::class, 'storeSingle'])->name('settings.single');

                Route::get('system-logs', [SystemLogsController::class, 'index'])->name('system-logs.index');
                Route::delete('system-logs', [SystemLogsController::class, 'clear'])->name('system-logs.clear');
            });
        });

    Route::middleware('auth')->post($logoutPath, [LoginController::class, 'destroy'])->name('admin.logout');
};

$adminAppDomain = AdminRouting::appDomain();

if ($adminAppDomain !== null) {
    Route::domain($adminAppDomain)->group($registerAdminRoutes);
} else {
    $registerAdminRoutes();
}
