<?php

use App\Http\Controllers\Admin\ActivityLogsController;
use App\Http\Controllers\Admin\ClubsController;
use App\Http\Controllers\Admin\DashboardController as AdminApiDashboardController;
use App\Http\Controllers\Admin\JerseyOrdersController;
use App\Http\Controllers\Admin\JerseysController;
use App\Http\Controllers\Admin\LeaguesController;
use App\Http\Controllers\Admin\LoyaltyTiersController;
use App\Http\Controllers\Admin\MediaAssetsController;
use App\Http\Controllers\Admin\PointTransactionsController;
use App\Http\Controllers\Admin\ReferralsController;
use App\Http\Controllers\Admin\SeasonsController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\StaffAssignmentsController;
use App\Http\Controllers\Admin\StaffMembersController;
use App\Http\Controllers\Admin\SystemLogsController;
use App\Http\Controllers\Admin\TaskReviewsController;
use App\Http\Controllers\Admin\TasksController;
use App\Http\Controllers\Admin\UsersController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\Api\Social\ChatMessageController as ApiSocialChatMessageController;
use App\Http\Controllers\Api\Social\FollowController as ApiSocialFollowController;
use App\Http\Controllers\Api\Social\PostLikeController as ApiSocialPostLikeController;
use App\Http\Controllers\Api\Social\TicketController as ApiSocialTicketController;
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
use App\Http\Controllers\Inertia\ClubsPageController;
use App\Http\Controllers\Inertia\Fan\CampaignPageController;
use App\Http\Controllers\Inertia\Fan\ConnectAccountsPageController;
use App\Http\Controllers\Inertia\Fan\DailyClaimPageController;
use App\Http\Controllers\Inertia\Fan\DashboardPageController;
use App\Http\Controllers\Inertia\Fan\LandingPageController;
use App\Http\Controllers\Inertia\Fan\PassportPageController;
use App\Http\Controllers\Inertia\Fan\StaticPageController;
use App\Http\Controllers\Inertia\Fan\TasksPageController as FanTasksPageController;
use App\Http\Controllers\Inertia\ImpersonationController;
use App\Http\Controllers\Inertia\JerseyOrdersPageController;
use App\Http\Controllers\Inertia\JerseysPageController;
use App\Http\Controllers\Inertia\LeaguesPageController;
use App\Http\Controllers\Inertia\LoyaltyTiersPageController;
use App\Http\Controllers\Inertia\MediaGalleryPageController;
use App\Http\Controllers\Inertia\PointTransactionsPageController;
use App\Http\Controllers\Inertia\ReferralsPageController;
use App\Http\Controllers\Inertia\SeasonsPageController;
use App\Http\Controllers\Inertia\SettingsPageController;
use App\Http\Controllers\Inertia\Social\SocialChatController;
use App\Http\Controllers\Inertia\Social\SocialChatMessageController;
use App\Http\Controllers\Inertia\Social\SocialDirectChatController;
use App\Http\Controllers\Inertia\Social\SocialFixtureController;
use App\Http\Controllers\Inertia\Social\SocialFollowController;
use App\Http\Controllers\Inertia\Social\SocialGroupChatController;
use App\Http\Controllers\Inertia\Social\SocialHomeController;
use App\Http\Controllers\Inertia\Social\SocialOnboardingController;
use App\Http\Controllers\Inertia\Social\SocialPassportController;
use App\Http\Controllers\Inertia\Social\SocialPostBookmarkController;
use App\Http\Controllers\Inertia\Social\SocialPostController;
use App\Http\Controllers\Inertia\Social\SocialPostHideController;
use App\Http\Controllers\Inertia\Social\SocialPostLikeController;
use App\Http\Controllers\Inertia\Social\SocialPostReportController;
use App\Http\Controllers\Inertia\Social\SocialPostShowController;
use App\Http\Controllers\Inertia\Social\SocialProfileController;
use App\Http\Controllers\Inertia\Social\SocialShopCartController;
use App\Http\Controllers\Inertia\Social\SocialShopCheckoutController;
use App\Http\Controllers\Inertia\Social\SocialShopController;
use App\Http\Controllers\Inertia\Social\SocialShopOrderController;
use App\Http\Controllers\Inertia\Social\SocialStageController;
use App\Http\Controllers\Inertia\Social\SocialStageLiveKitTokenController;
use App\Http\Controllers\Inertia\Social\SocialStageMessageController;
use App\Http\Controllers\Inertia\Social\SocialStageParticipantController;
use App\Http\Controllers\Inertia\Social\SocialStageSignalController;
use App\Http\Controllers\Inertia\Social\SocialStandingsController;
use App\Http\Controllers\Inertia\Social\SocialTicketController;
use App\Http\Controllers\Inertia\Social\SocialTicketPurchaseController;
use App\Http\Controllers\Inertia\Social\SocialVideoController;
use App\Http\Controllers\Inertia\StaffPageController;
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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// --------------------------------------------------------------------------
// Fan app (Inertia + sample UI)
// --------------------------------------------------------------------------
Route::get('/', LandingPageController::class)->name('fan.home');
Route::get('/campaign', CampaignPageController::class)->name('fan.campaign');
Route::get('/r/{fanId}', ReferralLandingController::class)->name('fan.referral');

Route::redirect('/whitepaper', '/about')->name('fan.whitepaper');
Route::get('/roadmap', fn () => app(StaticPageController::class)->show('roadmap'))->name('fan.roadmap');
Route::get('/region', fn () => app(StaticPageController::class)->show('region'))->name('fan.region');
Route::get('/team', fn () => app(StaticPageController::class)->show('team'))->name('fan.team');
Route::get('/about', fn () => app(StaticPageController::class)->show('about'))->name('fan.about');

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

        Route::middleware(['verified', 'social.enabled', 'social.onboarded'])
            ->prefix('api/social')
            ->name('api.social.')
            ->group(function () {
                Route::post('/posts/{post}/like', [ApiSocialPostLikeController::class, 'store'])
                    ->middleware('throttle:60,1')
                    ->name('posts.like');
                Route::delete('/posts/{post}/like', [ApiSocialPostLikeController::class, 'destroy'])
                    ->middleware('throttle:60,1')
                    ->name('posts.unlike');

                Route::post('/users/{user}/follow', [ApiSocialFollowController::class, 'store'])
                    ->middleware('throttle:60,1')
                    ->name('users.follow');
                Route::delete('/users/{user}/follow', [ApiSocialFollowController::class, 'destroy'])
                    ->middleware('throttle:60,1')
                    ->name('users.unfollow');

                Route::post('/chat/channels/{channel}/messages', [ApiSocialChatMessageController::class, 'store'])
                    ->middleware('throttle:60,1')
                    ->name('chat.messages.store');

                Route::get('/tickets/{ticket}', [ApiSocialTicketController::class, 'show'])
                    ->middleware('throttle:60,1')
                    ->name('tickets.show');
                Route::post('/tickets/matches/{match}/purchase', [ApiSocialTicketController::class, 'purchase'])
                    ->middleware('throttle:20,1')
                    ->name('tickets.purchase');
            });

        Route::middleware(['verified', 'social.enabled'])->prefix('social')->name('social.')->group(function () {
            Route::get('/onboarding/club', [SocialOnboardingController::class, 'create'])->name('onboarding.club');
            Route::post('/onboarding/club', [SocialOnboardingController::class, 'store'])
                ->middleware('throttle:12,1')
                ->name('onboarding.club.store');

            Route::middleware('social.onboarded')->group(function () {
                Route::get('/', SocialHomeController::class)->name('home');
                Route::redirect('/home', '/social');
                Route::get('/passport', SocialPassportController::class)->name('passport');
                Route::get('/chat', SocialChatController::class)->name('chat');
                Route::post('/chat/direct', [SocialDirectChatController::class, 'store'])
                    ->middleware('throttle:30,1')
                    ->name('chat.direct.store');
                Route::post('/chat/groups', [SocialGroupChatController::class, 'store'])
                    ->middleware('throttle:20,1')
                    ->name('chat.groups.store');
                Route::post('/chat/channels/{channel}/messages', [SocialChatMessageController::class, 'store'])
                    ->middleware('throttle:60,1')
                    ->name('chat.messages.store');

                Route::get('/stage', [SocialStageController::class, 'index'])->name('stage.index');
                Route::post('/stage', [SocialStageController::class, 'store'])
                    ->middleware('throttle:10,1')
                    ->name('stage.store');
                Route::get('/stage/{stage}', [SocialStageController::class, 'show'])->name('stage.show');
                Route::get('/stage/{stage}/room', [SocialStageController::class, 'room'])
                    ->middleware('throttle:stage-room')
                    ->name('stage.room');
                Route::post('/stage/{stage}/join', [SocialStageController::class, 'join'])
                    ->middleware('throttle:30,1')
                    ->name('stage.join');
                Route::post('/stage/{stage}/leave', [SocialStageController::class, 'leave'])
                    ->middleware('throttle:30,1')
                    ->name('stage.leave');
                Route::post('/stage/{stage}/end', [SocialStageController::class, 'end'])
                    ->middleware('throttle:20,1')
                    ->name('stage.end');
                Route::post('/stage/{stage}/voice', [SocialStageController::class, 'startVoice'])
                    ->middleware('throttle:20,1')
                    ->name('stage.voice');
                Route::post('/stage/{stage}/messages', [SocialStageMessageController::class, 'store'])
                    ->middleware('throttle:60,1')
                    ->name('stage.messages.store');
                Route::post('/stage/{stage}/speak-request', [SocialStageParticipantController::class, 'requestSpeak'])
                    ->middleware('throttle:20,1')
                    ->name('stage.speak-request');
                Route::post('/stage/{stage}/participants/{user}/promote', [SocialStageParticipantController::class, 'promote'])
                    ->middleware('throttle:30,1')
                    ->name('stage.participants.promote');
                Route::post('/stage/{stage}/participants/{user}/demote', [SocialStageParticipantController::class, 'demote'])
                    ->middleware('throttle:30,1')
                    ->name('stage.participants.demote');
                Route::post('/stage/{stage}/mute', [SocialStageParticipantController::class, 'mute'])
                    ->middleware('throttle:60,1')
                    ->name('stage.mute');
                Route::post('/stage/{stage}/participants/{user}/host-mute', [SocialStageParticipantController::class, 'hostMute'])
                    ->middleware('throttle:60,1')
                    ->name('stage.participants.host-mute');
                Route::post('/stage/{stage}/participants/{user}/ban', [SocialStageParticipantController::class, 'ban'])
                    ->middleware('throttle:30,1')
                    ->name('stage.participants.ban');
                Route::post('/stage/{stage}/transfer-host', [SocialStageParticipantController::class, 'transferHost'])
                    ->middleware('throttle:10,1')
                    ->name('stage.transfer-host');
                Route::post('/stage/{stage}/share', [SocialStageController::class, 'share'])
                    ->middleware('throttle:10,1')
                    ->name('stage.share');
                Route::get('/stage/{stage}/signals', [SocialStageSignalController::class, 'index'])
                    ->middleware('throttle:stage-signal-poll')
                    ->name('stage.signals.index');
                Route::post('/stage/{stage}/signals', [SocialStageSignalController::class, 'store'])
                    ->middleware('throttle:stage-signal-post')
                    ->name('stage.signals.store');
                Route::get('/stage/{stage}/livekit-token', SocialStageLiveKitTokenController::class)
                    ->middleware('throttle:60,1')
                    ->name('stage.livekit-token');

                Route::get('/videos', [SocialVideoController::class, 'index'])->name('videos.index');
                Route::post('/videos/{videoHighlight}/like', [SocialVideoController::class, 'like'])
                    ->middleware('throttle:60,1')
                    ->name('videos.like');
                Route::post('/videos/{videoHighlight}/view', [SocialVideoController::class, 'view'])
                    ->middleware('throttle:120,1')
                    ->name('videos.view');

                Route::get('/fixtures', SocialFixtureController::class)->name('fixtures');
                Route::get('/clubs', SocialStandingsController::class)->name('clubs');
                Route::get('/tickets', [SocialTicketController::class, 'index'])->name('tickets.index');
                Route::get('/tickets/mine', [SocialTicketController::class, 'mine'])->name('tickets.mine');
                Route::get('/tickets/{ticket}', [SocialTicketController::class, 'show'])->name('tickets.show');
                Route::post('/tickets/matches/{match}/purchase', SocialTicketPurchaseController::class)
                    ->middleware('throttle:20,1')
                    ->name('tickets.purchase');

                Route::get('/shop', [SocialShopController::class, 'index'])->name('shop.index');
                Route::get('/shop/cart', [SocialShopCartController::class, 'show'])->name('shop.cart');
                Route::post('/shop/cart', [SocialShopCartController::class, 'store'])
                    ->middleware('throttle:30,1')
                    ->name('shop.cart.store');
                Route::put('/shop/cart/{variant}', [SocialShopCartController::class, 'update'])
                    ->middleware('throttle:30,1')
                    ->name('shop.cart.update');
                Route::delete('/shop/cart/{variant}', [SocialShopCartController::class, 'destroy'])
                    ->middleware('throttle:30,1')
                    ->name('shop.cart.destroy');
                Route::get('/shop/checkout', [SocialShopCheckoutController::class, 'create'])->name('shop.checkout');
                Route::post('/shop/checkout', [SocialShopCheckoutController::class, 'store'])
                    ->middleware('throttle:10,1')
                    ->name('shop.checkout.store');
                Route::get('/shop/orders', [SocialShopOrderController::class, 'index'])->name('shop.orders.index');
                Route::get('/shop/orders/{order}', [SocialShopOrderController::class, 'show'])->name('shop.orders.show');
                Route::get('/shop/{jersey:slug}', [SocialShopController::class, 'show'])->name('shop.show');

                Route::get('/u/{handle}', SocialProfileController::class)
                    ->where('handle', '[A-Za-z0-9._\\-]+')
                    ->name('profile');

                Route::post('/users/{user}/follow', [SocialFollowController::class, 'store'])
                    ->middleware('throttle:60,1')
                    ->name('users.follow');
                Route::delete('/users/{user}/follow', [SocialFollowController::class, 'destroy'])
                    ->middleware('throttle:60,1')
                    ->name('users.unfollow');

                Route::post('/posts', [SocialPostController::class, 'store'])
                    ->middleware('throttle:30,1')
                    ->name('posts.store');
                Route::get('/posts/{post}', SocialPostShowController::class)->name('posts.show');
                Route::delete('/posts/{post}', [SocialPostController::class, 'destroy'])
                    ->middleware('throttle:30,1')
                    ->name('posts.destroy');
                Route::post('/posts/{post}/replies', [SocialPostController::class, 'reply'])
                    ->middleware('throttle:60,1')
                    ->name('posts.replies.store');
                Route::post('/posts/{post}/repost', [SocialPostController::class, 'repost'])
                    ->middleware('throttle:30,1')
                    ->name('posts.repost');
                Route::post('/posts/{post}/quote', [SocialPostController::class, 'quote'])
                    ->middleware('throttle:30,1')
                    ->name('posts.quote');
                Route::post('/posts/{post}/report', [SocialPostReportController::class, 'store'])
                    ->middleware('throttle:20,1')
                    ->name('posts.report');
                Route::post('/posts/{post}/like', [SocialPostLikeController::class, 'store'])
                    ->middleware('throttle:60,1')
                    ->name('posts.like');
                Route::delete('/posts/{post}/like', [SocialPostLikeController::class, 'destroy'])
                    ->middleware('throttle:60,1')
                    ->name('posts.unlike');
                Route::post('/posts/{post}/bookmark', [SocialPostBookmarkController::class, 'store'])
                    ->middleware('throttle:60,1')
                    ->name('posts.bookmark');
                Route::delete('/posts/{post}/bookmark', [SocialPostBookmarkController::class, 'destroy'])
                    ->middleware('throttle:60,1')
                    ->name('posts.unbookmark');
                Route::post('/posts/{post}/not-interested', [SocialPostHideController::class, 'store'])
                    ->middleware('throttle:30,1')
                    ->name('posts.not-interested');
                Route::delete('/posts/{post}/not-interested', [SocialPostHideController::class, 'destroy'])
                    ->middleware('throttle:30,1')
                    ->name('posts.interested');
            });
        });

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

// --------------------------------------------------------------------------
// Admin app (Inertia) — optional subdomain via ADMIN_DOMAIN / ADMIN_APP_DOMAIN
// --------------------------------------------------------------------------
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

            Route::post('/organization', AdminOrganizationSwitchController::class)->name('organization.switch');

            Route::get('/users', [UsersPageController::class, 'index'])->name('users');
            Route::get('/users/{user}', [UsersPageController::class, 'show'])->name('users.show');
            Route::put('/users/{user}', [UsersPageController::class, 'update'])->name('users.update');
            Route::get('/staff', [StaffPageController::class, 'index'])->name('staff.index');
            Route::get('/staff/{user}', [StaffPageController::class, 'show'])->name('staff.show');
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
            Route::get('/leagues', [LeaguesPageController::class, 'index'])->name('leagues');
            Route::get('/clubs', [ClubsPageController::class, 'index'])->name('clubs');
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
                Route::apiResource('leagues', LeaguesController::class);
                Route::apiResource('clubs', ClubsController::class);
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
