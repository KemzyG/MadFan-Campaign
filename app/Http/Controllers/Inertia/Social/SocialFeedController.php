<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Actions\Social\RecordPostView;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Social\FeedService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The fan post timeline — Global / Following.
 *
 * Formerly the Social landing page; it now sits on its own route so `/social`
 * can lead with live events ({@see SocialEventsController}).
 */
class SocialFeedController extends Controller
{
    public function __invoke(Request $request, FeedService $feedService, RecordPostView $recordPostView): Response
    {
        /** @var User|null $user */
        $user = $request->user();
        $user?->loadMissing('favouriteClub.league');

        // A guest has nobody to follow — always the global stream, and the
        // "Following" tab simply isn't reachable without an account (the
        // frontend hides the toggle for guests; this is the server-side
        // backstop for a hand-crafted ?mode=following request).
        $requestedMode = $request->string('mode')->toString();
        $mode = $requestedMode === 'following' && $user !== null ? 'following' : 'global';
        $club = $user?->favouriteClub;

        $paginator = $mode === 'following'
            ? $feedService->followingFeed($user)
            : $feedService->globalFeed($user);

        // Once-per-user feed impression (unique post_views); guests have no
        // user row to key a view against, so their reads simply aren't counted.
        if ($user !== null) {
            $recordPostView->forFeed($paginator->items(), $user);
        }

        $presented = $feedService->presentPaginator($paginator, $user);

        $emptyMessage = $mode === 'following'
            ? 'Follow fans to fill this terrace. Your own posts appear here too.'
            : 'Quiet floodlights — kick the first ball across every terrace.';

        return Inertia::render('Social/Feed', [
            'club' => $club ? [
                'id' => $club->id,
                'name' => $club->name,
                'short' => $club->short,
                'logo_url' => $club->logo_url,
                'league' => $club->league?->name,
            ] : null,
            'feed' => [
                'mode' => $mode,
                'posts' => $presented['data'],
                'meta' => $presented['meta'],
                'links' => $presented['links'],
                'empty_message' => $emptyMessage,
            ],
            'suggestions' => $feedService->suggestedFollows($user),
            'max_body_length' => FeedService::MAX_BODY_LENGTH,
            'max_images' => FeedService::MAX_IMAGES,
        ]);
    }
}
