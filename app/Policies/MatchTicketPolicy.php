<?php

namespace App\Policies;

use App\Models\MatchTicket;
use App\Models\User;

class MatchTicketPolicy
{
    public function viewAny(User $user): bool
    {
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
