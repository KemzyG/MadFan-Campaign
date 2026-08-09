<?php

namespace App\Policies;

use App\Models\Message;
use App\Models\User;

class MessagePolicy
{
    public function view(User $user, Message $message): bool
    {
        $message->loadMissing('channel.clubServer');

        return $user->can('view', $message->channel);
    }

    public function create(User $user): bool
    {
        return $user->social_onboarded_at !== null
            && $user->favourite_club_id !== null
            && $user->hasVerifiedEmail();
    }

    public function delete(User $user, Message $message): bool
    {
        if (! $this->view($user, $message)) {
            return false;
        }

        return $message->author_id === $user->id;
    }
}
