<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\MatchTicket;
use App\Models\User;
use App\Services\Social\StandingsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialStandingsController extends Controller
{
    public function __invoke(Request $request, StandingsService $standings): Response
    {
        /** @var User|null $user */
        $user = $request->user();

        $this->authorize('viewAny', MatchTicket::class);

        $validated = $request->validate([
            'league_id' => ['nullable', 'integer', 'exists:leagues,id'],
        ]);

        $leagueId = isset($validated['league_id']) ? (int) $validated['league_id'] : null;
        $league = $standings->resolveLeague($leagueId, $user);

        return Inertia::render('Social/Clubs', [
            'leagues' => $standings->presentLeagues(),
            'table' => $league !== null ? $standings->presentTable($league, $user) : null,
            'filters' => [
                'league_id' => $league?->id,
            ],
            'favourite_club_id' => $user?->favourite_club_id,
        ]);
    }
}
