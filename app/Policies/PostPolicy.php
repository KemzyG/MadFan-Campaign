<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;
use App\Services\Social\FeedService;

class PostPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isSocialReady($user);
    }

    public function view(?User $user, Post $post): bool
    {
        if ($user !== null && ! $this->isSocialReady($user)) {
            return false;
        }

        if ($post->is_hidden) {
            return false;
        }

        // A guest can only ever see Public posts — FeedService::canView already
        // encodes that (OnlyMe/Club both require a real, matching viewer).
        return app(FeedService::class)->canView($user, $post);
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
