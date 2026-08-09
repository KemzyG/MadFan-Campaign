<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Actions\Social\PurchaseMatchTicket;
use App\Http\Controllers\Controller;
use App\Models\MatchFixture;
use App\Models\MatchTicket;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SocialTicketPurchaseController extends Controller
{
    public function __invoke(
        Request $request,
        MatchFixture $match,
        PurchaseMatchTicket $purchase,
    ): RedirectResponse {
        /** @var User $user */
        $user = $request->user();

        $this->authorize('create', MatchTicket::class);

        $ticket = $purchase->handle($user, $match);

        return redirect()
            ->route('social.tickets.show', $ticket)
            ->with('success', 'Ticket issued — show the QR at the turnstile.');
    }
}
