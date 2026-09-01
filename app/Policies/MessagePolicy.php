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
            && $user->favourite_fandom_id !== null
            && $user->hasVerifiedEmail();
    }

    public function update(User $user, Message $message): bool
    {
        if (! $this->view($user, $message) || $message->trashed()) {
            return false;
        }

        if ((int) $message->author_id !== (int) $user->id) {
            return false;
        }

        return $message->created_at !== null
            && $message->created_at->greaterThan(now()->subMinutes(5));
    }

    public function delete(User $user, Message $message): bool
    {
        if (! $this->view($user, $message)) {
            return false;
        }

        return (int) $message->author_id === (int) $user->id;
    }
}
