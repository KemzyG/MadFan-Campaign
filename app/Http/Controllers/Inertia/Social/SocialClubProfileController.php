<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\ClubMembership;
use App\Models\User;
use App\Services\Social\FanLeaderboardService;
use App\Services\Social\StandingsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialClubProfileController extends Controller
{
    public function __invoke(
        Request $request,
        Club $club,
        StandingsService $standings,
        FanLeaderboardService $leaderboard,
    ): Response {
        /** @var User|null $user */
        $user = $request->user();

        $club->loadMissing('league:id,name');

        return Inertia::render('Social/Clubs/Show', [
            'club' => [
                'id' => $club->id,
                'name' => $club->name,
                'short' => $club->short,
                'logo_url' => $club->logo_url,
                'league' => $club->league?->name,
            ],
            'standing' => $standings->standingForClub($club, $user),
            'member_count' => ClubMembership::query()
                ->where('club_id', $club->id)
                ->where('is_primary', true)
                ->count(),
            'top_fans' => $leaderboard->present($user, 5, null, $club->id)['entries'],
            'is_favourite' => $user !== null && $user->favourite_club_id === $club->id,
        ]);
    }
}
