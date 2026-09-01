<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Services\Social\TournamentService;
use Inertia\Inertia;
use Inertia\Response;

class SocialTournamentController extends Controller
{
    public function __invoke(string $competition, TournamentService $tournaments): Response
    {
        $resolved = $tournaments->resolveCompetition($competition);

        abort_if($resolved === null, 404);

        return Inertia::render('Social/Tournament/Show', [
            'tournament' => $tournaments->present($resolved),
        ]);
    }
}
