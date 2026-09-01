<?php

namespace App\Http\Controllers\Inertia;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminLeaderboardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class LeaderboardPageController extends Controller
{
    public function __invoke(Request $request, AdminLeaderboardService $leaderboard): Response
    {
        Gate::authorize('viewDashboard');

        return Inertia::render('Admin/Leaderboard/Index', $leaderboard->pageData(
            scope: $request->string('scope')->toString() ?: 'global',
            fandomId: $request->integer('fandom_id') ?: null,
            clubId: $request->integer('club_id') ?: null,
            leagueId: $request->integer('league_id') ?: null,
            seasonId: $request->integer('season_id') ?: null,
            limit: $request->integer('limit', 50),
        ));
    }
}
