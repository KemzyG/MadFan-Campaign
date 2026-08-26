<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\Fandom;
use App\Models\User;
use App\Services\Social\FanLeaderboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The fan leaderboard, scoped one of three ways via `?scope=`:
 *   - global (default): every fan, app-wide.
 *   - fandom: fans of one fandom (defaults to the viewer's own fandom).
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
        $scope = in_array($scope, ['fandom', 'club'], true) ? $scope : 'global';

        $fandom = null;
        $club = null;

        if ($scope === 'fandom') {
            $fandomId = $request->integer('fandom_id') ?: $user->favourite_fandom_id;
            $fandom = $fandomId ? Fandom::query()->find($fandomId, ['id', 'name', 'slug']) : null;
            $scope = $fandom ? 'fandom' : 'global';
        }

        if ($scope === 'club') {
            $clubId = $request->integer('club_id') ?: $user->favourite_club_id;
            $club = $clubId ? Club::query()->with('league:id,name')->find($clubId) : null;
            $scope = $club ? 'club' : 'global';
        }

        $board = $leaderboard->present(
            $user,
            FanLeaderboardService::DEFAULT_LIMIT,
            $fandom?->id,
            $club?->id,
        );

        $viewerFandom = $user->favourite_fandom_id
            ? Fandom::query()->find($user->favourite_fandom_id, ['id', 'name', 'slug'])
            : null;
        $viewerClub = $user->favourite_club_id
            ? Club::query()->find($user->favourite_club_id, ['id', 'name', 'short', 'logo'])
            : null;

        return Inertia::render('Social/Leaderboard/Index', [
            ...$board,
            'scope' => $scope,
            'fandom' => $fandom ? ['id' => $fandom->id, 'name' => $fandom->name, 'slug' => $fandom->slug] : null,
            'club' => $club ? [
                'id' => $club->id,
                'name' => $club->name,
                'short' => $club->short,
                'logo_url' => $club->logo_url,
                'league' => $club->league?->name,
            ] : null,
            'viewer_fandom' => $viewerFandom ? ['id' => $viewerFandom->id, 'name' => $viewerFandom->name] : null,
            'viewer_club' => $viewerClub ? [
                'id' => $viewerClub->id,
                'name' => $viewerClub->name,
                'short' => $viewerClub->short,
                'logo_url' => $viewerClub->logo_url,
            ] : null,
        ]);
    }
}
