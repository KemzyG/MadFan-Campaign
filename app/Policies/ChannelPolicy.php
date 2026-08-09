<?php

namespace App\Policies;

use App\Models\Channel;
use App\Models\ClubMembership;
use App\Models\User;

class ChannelPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isSocialReady($user);
    }

    public function view(User $user, Channel $channel): bool
    {
        if (! $this->isSocialReady($user)) {
            return false;
        }

        $channel->loadMissing('clubServer');

        return $this->belongsToClub($user, (int) $channel->clubServer->club_id);
    }

    public function sendMessage(User $user, Channel $channel): bool
    {
        if (! $this->view($user, $channel)) {
            return false;
        }

        return ! $channel->is_read_only;
    }

    private function belongsToClub(User $user, int $clubId): bool
    {
        if ((int) $user->favourite_club_id === $clubId) {
            return true;
        }

        return ClubMembership::query()
            ->where('user_id', $user->id)
            ->where('club_id', $clubId)
            ->exists();
    }

    private function isSocialReady(User $user): bool
    {
        return $user->social_onboarded_at !== null
            && $user->favourite_club_id !== null
            && $user->hasVerifiedEmail();
    }
}
