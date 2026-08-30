<?php

namespace App\Policies;

use App\Models\MatchTicket;
use App\Models\User;

class MatchTicketPolicy
{
    /**
     * Browsing fixtures/standings (which reuse this ability as their page-view
     * gate) is guest-viewable; buying/viewing an actual ticket still isn't.
     */
    public function viewAny(?User $user): bool
    {
        if ($user === null) {
            return true;
        }

        return $this->isSocialReady($user);
    }

    public function view(User $user, MatchTicket $matchTicket): bool
    {
        return $this->isSocialReady($user) && $matchTicket->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $this->isSocialReady($user);
    }

    private function isSocialReady(User $user): bool
    {
        return $user->social_onboarded_at !== null
            && $user->favourite_club_id !== null
            && $user->hasVerifiedEmail();
    }
}
