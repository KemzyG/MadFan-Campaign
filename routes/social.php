<?php

use App\Http\Controllers\Api\Social\ChatMessageController as ApiSocialChatMessageController;
use App\Http\Controllers\Api\Social\ChatMembersController as ApiSocialChatMembersController;
use App\Http\Controllers\Api\Social\ChatRailController as ApiSocialChatRailController;
use App\Http\Controllers\Api\Social\FollowController as ApiSocialFollowController;
use App\Http\Controllers\Api\Social\PostLikeController as ApiSocialPostLikeController;
use App\Http\Controllers\Api\Social\TicketController as ApiSocialTicketController;
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
use App\Http\Middleware\TouchLastSeen;
use Illuminate\Support\Facades\Route;

/**
 * Register social Inertia + JSON API routes.
 *
 * @param  string  $pathPrefix  "" for subdomain root, "social" for path mode / legacy.
 * @param  string  $apiPrefix  "" or "api/social"
 * @param  bool  $withNames  Whether to register named routes (only once per app boot).
 */
return function (string $pathPrefix, string $apiPrefix, bool $withNames): void {
    Route::middleware(['app.maintenance', 'auth', TouchLastSeen::class])->group(function () use ($pathPrefix, $apiPrefix, $withNames): void {
        // Only register once per domain: apiPrefix doesn't vary between the canonical
        // and legacy-path page mounts, so a second pass would just clobber these names.
        if ($withNames) {
            $api = Route::middleware(['verified', 'social.enabled', 'social.onboarded']);
            if ($apiPrefix !== '') {
                $api->prefix($apiPrefix);
            }
            $api->name('api.social.');
            $api->group(function () {
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
                Route::get('/chat/rail', ApiSocialChatRailController::class)
                    ->middleware('throttle:120,1')
                    ->name('chat.rail');
                Route::get('/chat/channels/{channel}/members', ApiSocialChatMembersController::class)
                    ->middleware('throttle:120,1')
                    ->name('chat.channels.members');

                Route::get('/tickets/{ticket}', [ApiSocialTicketController::class, 'show'])
                    ->middleware('throttle:60,1')
                    ->name('tickets.show');
                Route::post('/tickets/matches/{match}/purchase', [ApiSocialTicketController::class, 'purchase'])
                    ->middleware('throttle:20,1')
                    ->name('tickets.purchase');
            });
        }

        $pages = Route::middleware(['verified', 'social.enabled']);
        if ($pathPrefix !== '') {
            $pages->prefix($pathPrefix);
        }
        if ($withNames) {
            $pages->name('social.');
        }
        $pages->group(function () use ($pathPrefix) {
            Route::get('/onboarding/club', [SocialOnboardingController::class, 'create'])->name('onboarding.club');
            Route::post('/onboarding/club', [SocialOnboardingController::class, 'store'])
                ->middleware('throttle:12,1')
                ->name('onboarding.club.store');

            Route::middleware('social.onboarded')->group(function () use ($pathPrefix) {
                Route::get('/', SocialHomeController::class)->name('home');
                $homeTarget = $pathPrefix === '' ? '/' : '/'.trim($pathPrefix, '/');
                Route::redirect('/home', $homeTarget);
                Route::get('/passport', SocialPassportController::class)->name('passport');
                Route::get('/chat', [SocialChatController::class, 'index'])->name('chat');
                Route::get('/chat/thread/{channelKey}', [SocialChatController::class, 'show'])
                    ->where('channelKey', '[A-Za-z0-9_\-]+')
                    ->name('chat.thread');
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
                Route::patch('/stage/{stage}', [SocialStageController::class, 'update'])
                    ->middleware('throttle:20,1')
                    ->name('stage.update');
                Route::get('/stage/{stage}', [SocialStageController::class, 'show'])->name('stage.show');
                Route::get('/stage/{stage}/room', [SocialStageController::class, 'room'])
                    ->middleware('throttle:stage-room')
                    ->name('stage.room');
                Route::post('/stage/{stage}/heartbeat', [SocialStageController::class, 'heartbeat'])
                    ->middleware('throttle:stage-heartbeat')
                    ->name('stage.heartbeat');
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
                Route::post('/stage/{stage}/participants/{user}/dismiss-hand', [SocialStageParticipantController::class, 'dismissHand'])
                    ->middleware('throttle:30,1')
                    ->name('stage.participants.dismiss-hand');
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
                Route::post('/stage/{stage}/pin', [SocialStageController::class, 'pin'])
                    ->middleware('throttle:30,1')
                    ->name('stage.pin');
                Route::post('/stage/{stage}/reactions', [SocialStageController::class, 'react'])
                    ->middleware('throttle:stage-reaction')
                    ->name('stage.reactions.store');
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

    });
};
