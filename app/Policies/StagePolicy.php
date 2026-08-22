<?php

namespace App\Policies;

use App\Enums\StageParticipantRole;
use App\Enums\StageStatus;
use App\Models\Stage;
use App\Models\StageParticipant;
use App\Models\User;

class StagePolicy
{
    /**
     * Live Stage lobby is network-wide — any Social-ready fan may list rooms.
     * Do not scope by favourite club (unlike club terrace chat).
     */
    public function viewAny(User $user): bool
    {
        return $this->canAccessStageNetwork($user);
    }

    /**
     * Any Social-ready fan may open a Stage room (club_id on the Stage is metadata only).
     */
    public function view(User $user, Stage $stage): bool
    {
        return $this->canAccessStageNetwork($user);
    }

    public function create(User $user): bool
    {
        return $this->canAccessStageNetwork($user);
    }

    /**
     * Any Social-ready fan may join a live Stage — no host-club or friend matching.
     */
    public function join(User $user, Stage $stage): bool
    {
        return $this->canAccessStageNetwork($user) && $stage->status === StageStatus::Live;
    }

    public function leave(User $user, Stage $stage): bool
    {
        return $this->canAccessStageNetwork($user)
            && $this->activeParticipant($stage, $user) !== null;
    }

    public function end(User $user, Stage $stage): bool
    {
        return $this->canAccessStageNetwork($user)
            && (int) $stage->host_id === (int) $user->id
            && $stage->status === StageStatus::Live;
    }

    public function startVoice(User $user, Stage $stage): bool
    {
        return $this->end($user, $stage);
    }

    public function manageSpeakers(User $user, Stage $stage): bool
    {
        return $this->end($user, $stage);
    }

    public function sendMessage(User $user, Stage $stage): bool
    {
        return $this->canAccessStageNetwork($user)
            && $stage->status === StageStatus::Live
            && $stage->allow_chat
            && $this->activeParticipant($stage, $user) !== null;
    }

    public function signal(User $user, Stage $stage): bool
    {
        if (! $this->sendMessage($user, $stage)) {
            return false;
        }

        return $stage->voice_enabled;
    }

    /**
     * LiveKit join token — same gate as mesh signaling (live participant + voice on).
     */
    public function livekitToken(User $user, Stage $stage): bool
    {
        return $this->signal($user, $stage);
    }

    public function requestSpeak(User $user, Stage $stage): bool
    {
        $participant = $this->activeParticipant($stage, $user);

        return $this->canAccessStageNetwork($user)
            && $stage->status === StageStatus::Live
            && $participant !== null
            && $participant->role === StageParticipantRole::Listener;
    }

    public function muteSelf(User $user, Stage $stage): bool
    {
        $participant = $this->activeParticipant($stage, $user);

        return $participant !== null && $participant->isOnStage();
    }

    public function hostMute(User $user, Stage $stage): bool
    {
        return $this->manageSpeakers($user, $stage);
    }

    public function ban(User $user, Stage $stage): bool
    {
        return $this->manageSpeakers($user, $stage);
    }

    public function transferHost(User $user, Stage $stage): bool
    {
        return $this->end($user, $stage);
    }

    public function share(User $user, Stage $stage): bool
    {
        return $this->sendMessage($user, $stage) && $stage->allow_invite;
    }

    private function activeParticipant(Stage $stage, User $user): ?StageParticipant
    {
        return StageParticipant::query()
            ->where('stage_id', $stage->id)
            ->where('user_id', $user->id)
            ->whereNull('left_at')
            ->first();
    }

    /**
     * Social shell gate only — not club membership matching on the Stage.
     */
    private function canAccessStageNetwork(User $user): bool
    {
        return $user->social_onboarded_at !== null
            && $user->favourite_club_id !== null
            && $user->hasVerifiedEmail();
    }
}
