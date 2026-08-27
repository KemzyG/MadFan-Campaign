<?php

namespace App\Policies;

use App\Models\LiveStage;
use App\Models\User;
use App\Services\LiveStage\LiveStageService;

class LiveStagePolicy
{
    public function viewAny(User $user): bool
    {
        return $this->canAccessLiveNetwork($user);
    }

    public function view(User $user, LiveStage $stage): bool
    {
        return $this->canAccessLiveNetwork($user);
    }

    public function create(User $user): bool
    {
        return $this->canAccessLiveNetwork($user);
    }

    public function start(User $user, LiveStage $stage): bool
    {
        return $this->canAccessLiveNetwork($user) && $stage->isHost($user);
    }

    public function end(User $user, LiveStage $stage): bool
    {
        return $this->canAccessLiveNetwork($user) && $stage->isHost($user) && $stage->isLive();
    }

    public function join(User $user, LiveStage $stage): bool
    {
        return $this->canAccessLiveNetwork($user) && $stage->isLive();
    }

    public function leave(User $user, LiveStage $stage): bool
    {
        return $this->canAccessLiveNetwork($user)
            && app(LiveStageService::class)->activeSession($stage, $user) !== null;
    }

    public function comment(User $user, LiveStage $stage): bool
    {
        return $this->canAccessLiveNetwork($user)
            && $stage->isLive()
            && (bool) ($stage->settings['allow_comments'] ?? true)
            && app(LiveStageService::class)->activeSession($stage, $user) !== null;
    }

    public function react(User $user, LiveStage $stage): bool
    {
        return $this->canAccessLiveNetwork($user)
            && $stage->isLive()
            && (bool) ($stage->settings['allow_reactions'] ?? true)
            && app(LiveStageService::class)->activeSession($stage, $user) !== null;
    }

    public function moderate(User $user, LiveStage $stage): bool
    {
        if ($stage->isHost($user)) {
            return true;
        }

        return $stage->staff()->where('user_id', $user->id)->exists();
    }

    public function mediaToken(User $user, LiveStage $stage): bool
    {
        return $this->canAccessLiveNetwork($user)
            && $stage->isLive()
            && ($stage->isHost($user) || app(LiveStageService::class)->activeSession($stage, $user) !== null);
    }

    /**
     * Same eligibility gate as the existing Stage feature — Social-onboarded,
     * favourite club chosen, email verified.
     */
    private function canAccessLiveNetwork(User $user): bool
    {
        return $user->social_onboarded_at !== null
            && $user->favourite_club_id !== null
            && $user->hasVerifiedEmail();
    }
}
