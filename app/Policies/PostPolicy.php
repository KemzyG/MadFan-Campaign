<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isSocialReady($user);
    }

    public function view(User $user, Post $post): bool
    {
        if (! $this->isSocialReady($user)) {
            return false;
        }

        return ! $post->is_hidden;
    }

    public function create(User $user): bool
    {
        return $this->isSocialReady($user);
    }

    public function update(User $user, Post $post): bool
    {
        return $this->isSocialReady($user) && $post->author_id === $user->id;
    }

    public function delete(User $user, Post $post): bool
    {
        return $this->isSocialReady($user) && $post->author_id === $user->id;
    }

    public function like(User $user, Post $post): bool
    {
        return $this->view($user, $post);
    }

    public function reply(User $user, Post $post): bool
    {
        return $this->view($user, $post) && $this->create($user);
    }

    public function bookmark(User $user, Post $post): bool
    {
        return $this->view($user, $post);
    }

    public function hide(User $user, Post $post): bool
    {
        return $this->view($user, $post) && $post->author_id !== $user->id;
    }

    private function isSocialReady(User $user): bool
    {
        return $user->social_onboarded_at !== null
            && $user->favourite_club_id !== null
            && $user->hasVerifiedEmail();
    }
}
