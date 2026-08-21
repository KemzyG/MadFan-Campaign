<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\MatchTicket;
use App\Models\User;
use App\Services\Social\FixtureService;
use App\Services\Social\MatchTicketService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialFixtureController extends Controller
{
    public function __invoke(
        Request $request,
        FixtureService $fixtures,
        MatchTicketService $tickets,
    ): Response {
        /** @var User $user */
        $user = $request->user();

        $this->authorize('viewAny', MatchTicket::class);

        $board = $fixtures->boardFor($user);
        $tab = $this->normalizeTab($request->string('tab')->toString());

        return Inertia::render('Social/Fixtures', [
            'tab' => $tab,
            'board' => $board,
            'ticket_count' => $tickets->ticketCountForUser($user),
            'poll_ms' => 15000,
        ]);
    }

    private function normalizeTab(string $tab): string
    {
        return match ($tab) {
            'live', 'today', 'coming', 'past' => $tab,
            default => 'all',
        };
    }
}
