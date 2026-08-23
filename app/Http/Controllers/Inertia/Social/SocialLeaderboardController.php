<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Services\Social\FanLeaderboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialLeaderboardController extends Controller
{
    public function __invoke(Request $request, FanLeaderboardService $leaderboard): Response
    {
        $board = $leaderboard->present($request->user(), FanLeaderboardService::DEFAULT_LIMIT);

        return Inertia::render('Social/Leaderboard/Index', $board);
    }
}
