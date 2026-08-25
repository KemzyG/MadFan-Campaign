<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\Sport;
use App\Models\User;
use App\Services\Social\FanLeaderboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The fan leaderboard, scoped one of three ways via `?scope=`:
 *   - global (default): every fan, app-wide.
 *   - sport: fans of one sport (defaults to the viewer's own sport).
 *   - club: fans of one club (defaults to the viewer's own club) — every
 *     club gets its own board this way, not just the viewer's.
 */
class SocialLeaderboardController extends Controller
{
    public function __invoke(Request $request, FanLeaderboardService $leaderboard): Response
    {
        /** @var User $user */
        $user = $request->user();

        $scope = $request->string('scope')->toString();
        $scope = in_array($scope, ['sport', 'club'], true) ? $scope : 'global';

        $sport = null;
        $club = null;

        if ($scope === 'sport') {
            $sportId = $request->integer('sport_id') ?: $user->favourite_sport_id;
            $sport = $sportId ? Sport::query()->find($sportId, ['id', 'name', 'slug']) : null;
            $scope = $sport ? 'sport' : 'global';
        }

        if ($scope === 'club') {
            $clubId = $request->integer('club_id') ?: $user->favourite_club_id;
            $club = $clubId ? Club::query()->with('league:id,name')->find($clubId) : null;
            $scope = $club ? 'club' : 'global';
        }

        $board = $leaderboard->present(
            $user,
            FanLeaderboardService::DEFAULT_LIMIT,
            $sport?->id,
            $club?->id,
        );

        $viewerSport = $user->favourite_sport_id
            ? Sport::query()->find($user->favourite_sport_id, ['id', 'name', 'slug'])
            : null;
        $viewerClub = $user->favourite_club_id
            ? Club::query()->find($user->favourite_club_id, ['id', 'name', 'short', 'logo'])
            : null;

        return Inertia::render('Social/Leaderboard/Index', [
            ...$board,
            'scope' => $scope,
            'sport' => $sport ? ['id' => $sport->id, 'name' => $sport->name, 'slug' => $sport->slug] : null,
            'club' => $club ? [
                'id' => $club->id,
                'name' => $club->name,
                'short' => $club->short,
                'logo_url' => $club->logo_url,
                'league' => $club->league?->name,
            ] : null,
            'viewer_sport' => $viewerSport ? ['id' => $viewerSport->id, 'name' => $viewerSport->name] : null,
            'viewer_club' => $viewerClub ? [
                'id' => $viewerClub->id,
                'name' => $viewerClub->name,
                'short' => $viewerClub->short,
                'logo_url' => $viewerClub->logo_url,
            ] : null,
        ]);
    }
}
