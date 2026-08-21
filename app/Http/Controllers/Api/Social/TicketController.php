<?php

namespace App\Http\Controllers\Api\Social;

use App\Actions\Social\PurchaseMatchTicket;
use App\Http\Controllers\Controller;
use App\Models\MatchFixture;
use App\Models\MatchTicket;
use App\Models\User;
use App\Services\Social\MatchTicketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    public function show(MatchTicket $ticket, MatchTicketService $tickets): JsonResponse
    {
        $this->authorize('view', $ticket);

        return response()->json([
            'message' => 'Ticket loaded.',
            'ticket' => $tickets->presentTicket($ticket),
        ]);
    }

    public function purchase(
        Request $request,
        MatchFixture $match,
        PurchaseMatchTicket $purchase,
        MatchTicketService $tickets,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        $this->authorize('create', MatchTicket::class);

        $ticket = $purchase->handle($user, $match);

        return response()->json([
            'message' => 'Ticket issued — show the QR at the turnstile.',
            'ticket' => $tickets->presentTicket($ticket),
            'ticket_count' => $tickets->ticketCountForUser($user),
        ], 201);
    }
}
