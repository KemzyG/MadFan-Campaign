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
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing('favouriteClub.league');

        $requestedMode = $request->string('mode')->toString();
        $mode = $requestedMode === 'following' ? 'following' : 'global';
        $club = $user->favouriteClub;

        $paginator = $mode === 'following'
            ? $feedService->followingFeed($user)
            : $feedService->globalFeed($user);

        // Once-per-user feed impression (unique post_views); does not re-increment on reloads.
        $recordPostView->forFeed($paginator->items(), $user);

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
            'max_body_length' => FeedService::MAX_BODY_LENGTH,
            'max_images' => FeedService::MAX_IMAGES,
        ]);
    }
}
