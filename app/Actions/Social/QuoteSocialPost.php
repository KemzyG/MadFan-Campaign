<?php

namespace App\Actions\Social;

use App\Enums\PostType;
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class QuoteSocialPost
{
    public function handle(User $author, Post $original, string $body): Post
    {
        if ($author->favourite_club_id === null) {
            throw new InvalidArgumentException('Favourite club is required before posting.');
        }

        if ($original->reply_to_id !== null) {
            throw new InvalidArgumentException('Replies cannot be quoted.');
        }

        return DB::transaction(function () use ($author, $original, $body): Post {
            $post = Post::query()->create([
                'author_id' => $author->id,
                'club_id' => $author->favourite_club_id,
                'type' => PostType::Quote,
                'body' => $body,
                'quote_of_id' => $original->id,
                'published_at' => now(),
            ]);

            $original->increment('quotes_count');

            return $post;
        });
    }
}
