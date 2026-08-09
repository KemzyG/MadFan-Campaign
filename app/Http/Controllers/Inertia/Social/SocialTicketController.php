<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\MatchTicket;
use App\Models\User;
use App\Services\Social\MatchTicketService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialTicketController extends Controller
{
    public function index(Request $request, MatchTicketService $tickets): Response
    {
        /** @var User $user */
        $user = $request->user();

        $this->authorize('viewAny', MatchTicket::class);

        return Inertia::render('Social/Tickets/Index', [
            'matches' => $tickets->presentUpcomingMatches($user),
            'ticket_count' => $tickets->ticketCountForUser($user),
        ]);
    }

    public function mine(Request $request, MatchTicketService $tickets): Response
    {
        /** @var User $user */
        $user = $request->user();

        $this->authorize('viewAny', MatchTicket::class);

        return Inertia::render('Social/Tickets/Mine', [
            'tickets' => $tickets->presentUserTickets($user),
        ]);
    }

    public function show(Request $request, MatchTicket $ticket, MatchTicketService $tickets): Response
    {
        $this->authorize('view', $ticket);

        return Inertia::render('Social/Tickets/Show', [
            'ticket' => $tickets->presentTicket($ticket),
        ]);
    }
}
