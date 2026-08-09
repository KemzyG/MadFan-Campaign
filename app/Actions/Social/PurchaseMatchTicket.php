<?php

namespace App\Actions\Social;

use App\Enums\MatchTicketStatus;
use App\Models\MatchFixture;
use App\Models\MatchTicket;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PurchaseMatchTicket
{
    public function handle(User $user, MatchFixture $match): MatchTicket
    {
        if (! $match->isPurchasable()) {
            throw ValidationException::withMessages([
                'match' => 'This match is not available for tickets.',
            ]);
        }

        $existing = MatchTicket::query()
            ->where('user_id', $user->id)
            ->where('match_fixture_id', $match->id)
            ->where('status', '!=', MatchTicketStatus::Cancelled)
            ->first();

        if ($existing !== null) {
            throw ValidationException::withMessages([
                'match' => 'You already hold a ticket for this match.',
            ]);
        }

        return DB::transaction(function () use ($user, $match): MatchTicket {
            $locked = MatchFixture::query()->whereKey($match->id)->lockForUpdate()->firstOrFail();

            if (! $locked->isPurchasable()) {
                throw ValidationException::withMessages([
                    'match' => 'This match is not available for tickets.',
                ]);
            }

            $again = MatchTicket::query()
                ->where('user_id', $user->id)
                ->where('match_fixture_id', $locked->id)
                ->where('status', '!=', MatchTicketStatus::Cancelled)
                ->lockForUpdate()
                ->exists();

            if ($again) {
                throw ValidationException::withMessages([
                    'match' => 'You already hold a ticket for this match.',
                ]);
            }

            return MatchTicket::query()->create([
                'user_id' => $user->id,
                'match_fixture_id' => $locked->id,
                'status' => MatchTicketStatus::Paid,
                'price' => $locked->price,
                'section' => 'General Admission',
                'seat' => null,
                'code' => MatchTicket::generateCode(),
                'purchased_at' => now(),
            ]);
        });
    }
}
