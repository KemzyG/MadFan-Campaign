<?php

namespace App\Policies;

use App\Models\User;
use App\Models\VideoHighlight;

class VideoHighlightPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isSocialReady($user);
    }

    public function view(User $user, VideoHighlight $videoHighlight): bool
    {
        return $this->isSocialReady($user);
    }

    public function create(User $user): bool
    {
        return $this->isSocialReady($user);
    }

    public function like(User $user, VideoHighlight $videoHighlight): bool
    {
        return $this->view($user, $videoHighlight);
    }

    public function delete(User $user, VideoHighlight $videoHighlight): bool
    {
        return $this->isSocialReady($user) && $videoHighlight->author_id === $user->id;
    }

    private function isSocialReady(User $user): bool
    {
        return $user->social_onboarded_at !== null
            && $user->favourite_club_id !== null
            && $user->hasVerifiedEmail();
    }
}
