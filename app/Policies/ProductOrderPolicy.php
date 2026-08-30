<?php

namespace App\Policies;

use App\Models\ProductOrder;
use App\Models\User;

class ProductOrderPolicy
{
    /**
     * Browsing the shop (which reuses this ability as its page-view gate) is
     * guest-viewable; viewing/placing an actual order still isn't.
     */
    public function viewAny(?User $user): bool
    {
        if ($user === null) {
            return true;
        }

        return $this->isSocialReady($user);
    }

    public function view(User $user, ProductOrder $productOrder): bool
    {
        return $this->isSocialReady($user) && $productOrder->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $this->isSocialReady($user);
    }

    /**
     * Unlike the legacy jersey shop, the general store isn't gated on having
     * picked a favourite club — plenty of what it sells (subscriptions,
     * esports/music collectibles) has nothing to do with football.
     */
    private function isSocialReady(User $user): bool
    {
        return $user->social_onboarded_at !== null && $user->hasVerifiedEmail();
    }
}
