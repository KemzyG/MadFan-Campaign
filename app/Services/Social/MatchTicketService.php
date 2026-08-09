<?php

namespace App\Services\Social;

use App\Enums\MatchTicketStatus;
use App\Models\Club;
use App\Models\MatchFixture;
use App\Models\MatchTicket;
use App\Models\User;

class MatchTicketService
{
    /**
     * @return list<array<string, mixed>>
     */
    public function presentUpcomingMatches(User $user): array
    {
        $ownedMatchIds = MatchTicket::query()
            ->where('user_id', $user->id)
            ->where('status', '!=', MatchTicketStatus::Cancelled)
            ->pluck('match_fixture_id')
            ->all();

        return MatchFixture::query()
            ->upcoming()
            ->with(['homeClub.league', 'awayClub.league'])
            ->limit(40)
            ->get()
            ->map(fn (MatchFixture $match): array => $this->presentMatch($match, in_array($match->id, $ownedMatchIds, true)))
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function presentUserTickets(User $user): array
    {
        return MatchTicket::query()
            ->where('user_id', $user->id)
            ->where('status', '!=', MatchTicketStatus::Cancelled)
            ->with(['matchFixture.homeClub', 'matchFixture.awayClub'])
            ->latest('purchased_at')
            ->get()
            ->map(fn (MatchTicket $ticket): array => $this->presentTicketSummary($ticket))
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function presentTicket(MatchTicket $ticket): array
    {
        $ticket->loadMissing(['matchFixture.homeClub', 'matchFixture.awayClub', 'user']);

        $match = $ticket->matchFixture;

        return [
            'id' => $ticket->id,
            'status' => $ticket->status->value,
            'price' => (string) $ticket->price,
            'section' => $ticket->section,
            'seat' => $ticket->seat,
            'code' => $ticket->code,
            'qr_payload' => $ticket->qrPayload(),
            'purchased_at' => $ticket->purchased_at?->toIso8601String(),
            'holder' => [
                'name' => $ticket->user?->name,
                'handle' => $ticket->user?->handle,
                'fan_id' => $ticket->user?->fan_id,
            ],
            'match' => $match ? $this->presentMatch($match, true) : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function presentTicketSummary(MatchTicket $ticket): array
    {
        $ticket->loadMissing(['matchFixture.homeClub', 'matchFixture.awayClub']);

        $match = $ticket->matchFixture;

        return [
            'id' => $ticket->id,
            'status' => $ticket->status->value,
            'price' => (string) $ticket->price,
            'section' => $ticket->section,
            'code' => $ticket->code,
            'purchased_at' => $ticket->purchased_at?->toIso8601String(),
            'match' => $match ? $this->presentMatch($match, true) : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function presentMatch(MatchFixture $match, bool $owned = false): array
    {
        $match->loadMissing(['homeClub', 'awayClub']);

        return [
            'id' => $match->id,
            'kickoff_at' => $match->kickoff_at?->toIso8601String(),
            'venue' => $match->venue,
            'status' => $match->status->value,
            'price' => (string) $match->price,
            'competition' => $match->competition,
            'purchasable' => $match->isPurchasable() && ! $owned,
            'owned' => $owned,
            'home' => $this->presentClub($match->homeClub),
            'away' => $this->presentClub($match->awayClub),
        ];
    }

    /**
     * @return array{id: int, name: string, short: string|null, logo_url: string|null}|null
     */
    public function presentClub(?Club $club): ?array
    {
        if ($club === null) {
            return null;
        }

        return [
            'id' => $club->id,
            'name' => $club->name,
            'short' => $club->short,
            'logo_url' => $club->logo_url,
        ];
    }

    public function ticketCountForUser(User $user): int
    {
        return MatchTicket::query()
            ->where('user_id', $user->id)
            ->where('status', '!=', MatchTicketStatus::Cancelled)
            ->count();
    }
}
