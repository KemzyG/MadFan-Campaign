<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Actions\Social\RecordPostView;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Social\FeedService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialHomeController extends Controller
{
    public function __invoke(Request $request, FeedService $feedService, RecordPostView $recordPostView): Response
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing('favouriteClub.league');

        $mode = $request->string('mode')->toString() === 'following' ? 'following' : 'club';
        $club = $user->favouriteClub;

        $paginator = $mode === 'following'
            ? $feedService->followingFeed($user)
            : $feedService->clubFeed($user);

        // Once-per-user feed impression (unique post_views); does not re-increment on reloads.
        $recordPostView->forFeed($paginator->items(), $user);

        $presented = $feedService->presentPaginator($paginator, $user);

        $emptyMessage = $mode === 'following'
            ? 'Follow fans to fill this terrace. Your own posts appear here too.'
            : 'Quiet floodlights — kick the first ball for '.($club?->name ?? 'your club').'.';

        return Inertia::render('Social/Home', [
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
