<?php

namespace App\Policies;

use App\Enums\StageParticipantRole;
use App\Enums\StageStatus;
use App\Models\Stage;
use App\Models\StageParticipant;
use App\Models\User;

class StagePolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isSocialReady($user);
    }

    public function view(User $user, Stage $stage): bool
    {
        return $this->isSocialReady($user);
    }

    public function create(User $user): bool
    {
        return $this->isSocialReady($user);
    }

    public function join(User $user, Stage $stage): bool
    {
        return $this->isSocialReady($user) && $stage->status === StageStatus::Live;
    }

    public function leave(User $user, Stage $stage): bool
    {
        return $this->isSocialReady($user)
            && $this->activeParticipant($stage, $user) !== null;
    }

    public function end(User $user, Stage $stage): bool
    {
        return $this->isSocialReady($user)
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
        return $this->isSocialReady($user)
            && $stage->status === StageStatus::Live
            && $this->activeParticipant($stage, $user) !== null;
    }

    public function signal(User $user, Stage $stage): bool
    {
        if (! $this->sendMessage($user, $stage)) {
            return false;
        }

        return $stage->voice_enabled;
    }

    public function requestSpeak(User $user, Stage $stage): bool
    {
        $participant = $this->activeParticipant($stage, $user);

        return $this->isSocialReady($user)
            && $stage->status === StageStatus::Live
            && $participant !== null
            && $participant->role === StageParticipantRole::Listener;
    }

    public function muteSelf(User $user, Stage $stage): bool
    {
        $participant = $this->activeParticipant($stage, $user);

        return $participant !== null && $participant->isOnStage();
    }

    private function activeParticipant(Stage $stage, User $user): ?StageParticipant
    {
        return StageParticipant::query()
            ->where('stage_id', $stage->id)
            ->where('user_id', $user->id)
            ->whereNull('left_at')
            ->first();
    }

    private function isSocialReady(User $user): bool
    {
        return $user->social_onboarded_at !== null
            && $user->favourite_club_id !== null
            && $user->hasVerifiedEmail();
    }
}
