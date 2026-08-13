<?php

namespace App\Policies;

use App\Models\JerseyOrder;
use App\Models\User;

class JerseyOrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isSocialReady($user);
    }

    public function view(User $user, JerseyOrder $jerseyOrder): bool
    {
        return $this->isSocialReady($user) && $jerseyOrder->user_id === $user->id;
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
