<?php

namespace App\Policies;

use App\Enums\ChannelScope;
use App\Models\Channel;
use App\Models\ClubMembership;
use App\Models\FandomFollow;
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

        if ($channel->isDirect() && ! $this->canAccessDirectChannel($user, $channel)) {
            return false;
        }

        return match ($channel->scope ?? ChannelScope::Club) {
            ChannelScope::Fandom => $this->belongsToFandomChannel($user, $channel),
            ChannelScope::Club => $this->belongsToClubChannel($user, $channel),
            ChannelScope::Direct, ChannelScope::Group => $channel->hasMember($user),
        };
    }

    public function sendMessage(User $user, Channel $channel): bool
    {
        if (! $this->view($user, $channel)) {
            return false;
        }

        if ($channel->isDirect() && ! $this->canAccessDirectChannel($user, $channel)) {
            return false;
        }

        return ! $channel->is_read_only;
    }

    private function canAccessDirectChannel(User $user, Channel $channel): bool
    {
        $channel->loadMissing('memberships');

        $peerId = $channel->memberships
            ->first(fn ($membership) => (int) $membership->user_id !== (int) $user->id)
            ?->user_id;

        if ($peerId === null) {
            return true;
        }

        $peer = User::query()->find($peerId);

        return $peer === null || ! $user->isBlockedWith($peer);
    }

    private function belongsToFandomChannel(User $user, Channel $channel): bool
    {
        $channel->loadMissing('fandomServer');

        if ($channel->fandomServer === null) {
            return false;
        }

        return $this->belongsToFandom($user, (int) $channel->fandomServer->fandom_id);
    }

    private function belongsToFandom(User $user, int $fandomId): bool
    {
        if ((int) $user->favourite_fandom_id === $fandomId) {
            return true;
        }

        return FandomFollow::query()
            ->where('user_id', $user->id)
            ->where('fandom_id', $fandomId)
            ->exists();
    }

    private function belongsToClubChannel(User $user, Channel $channel): bool
    {
        $channel->loadMissing('clubServer');

        if ($channel->clubServer === null) {
            return false;
        }

        return $this->belongsToClub($user, (int) $channel->clubServer->club_id);
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
            && $user->favourite_fandom_id !== null
            && $user->hasVerifiedEmail();
    }
}
