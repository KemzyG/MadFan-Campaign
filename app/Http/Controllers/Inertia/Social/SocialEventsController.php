<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Enums\EventType;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Social\EventFeedService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The Social landing surface: "🔴 What's happening NOW".
 *
 * Nothing but event cards — the post timeline lives on {@see SocialFeedController}.
 */
class SocialEventsController extends Controller
{
    public function __invoke(Request $request, EventFeedService $events): Response
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing('favouriteClub.league');

        $only = EventType::tryFrom($request->string('type')->toString());

        // One pass feeds both the page and the filter chips, so the chip counts
        // always describe the unfiltered stream the viewer can switch back to.
        $cards = $events->cards($user);

        $club = $user->favouriteClub;

        return Inertia::render('Social/Events', [
            'club' => $club ? [
                'id' => $club->id,
                'name' => $club->name,
                'short' => $club->short,
                'logo_url' => $club->logo_url,
                'league' => $club->league?->name,
            ] : null,
            'events' => [
                ...$events->paginate($cards, $request->integer('page', 1), $only),
                'empty_message' => $only !== null
                    ? 'Nothing live under '.$only->label().' right now.'
                    : 'The stadium is quiet. Live matches, drops and Stages land here the moment they start.',
            ],
            'filters' => $events->filters($cards),
            'active_filter' => $only?->value,
        ]);
    }
}
