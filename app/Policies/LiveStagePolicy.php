<?php

namespace App\Policies;

use App\Models\LiveStage;
use App\Models\User;
use App\Services\LiveStage\LiveStageService;

class LiveStagePolicy
{
    /**
     * Live Now discovery is guest-viewable (matches TikTok/X/Facebook: browse
     * without an account, sign in only to act). Every other ability below
     * this one is unchanged and still requires a real, onboarded account.
     */
    public function viewAny(?User $user): bool
    {
        if ($user === null) {
            return true;
        }

        return $this->canAccessLiveNetwork($user);
    }

    public function view(?User $user, LiveStage $stage): bool
    {
        if ($user === null) {
            return $stage->is_public;
        }

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

    /**
     * A guest gets a real (subscribe-only) LiveKit token too — watching the
     * stream is content, not interaction, same boundary as everything else
     * in this policy: comment/react/moderate all still require a real session.
     */
    public function mediaToken(?User $user, LiveStage $stage): bool
    {
        if ($user === null) {
            return $stage->isLive() && $stage->is_public;
        }

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
