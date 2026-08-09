<?php

namespace App\Actions\Social;

use App\Enums\PostType;
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class RepostSocialPost
{
    public function handle(User $author, Post $original): Post
    {
        if ($author->favourite_club_id === null) {
            throw new InvalidArgumentException('Favourite club is required before posting.');
        }

        if ($original->reply_to_id !== null) {
            throw new InvalidArgumentException('Replies cannot be reposted.');
        }

        $existing = Post::query()
            ->where('author_id', $author->id)
            ->where('type', PostType::Repost)
            ->where('repost_of_id', $original->id)
            ->first();

        if ($existing !== null) {
            return $existing;
        }

        return DB::transaction(function () use ($author, $original): Post {
            $post = Post::query()->create([
                'author_id' => $author->id,
                'club_id' => $author->favourite_club_id,
                'type' => PostType::Repost,
                'body' => null,
                'repost_of_id' => $original->id,
                'published_at' => now(),
            ]);

            $original->increment('reposts_count');

            return $post;
        });
    }
}
