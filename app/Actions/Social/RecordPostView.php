<?php

namespace App\Actions\Social;

use App\Models\Post;
use App\Models\PostView;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class RecordPostView
{
    /**
     * Record a unique view for the viewer. Authors do not inflate their own count.
     * Idempotent: one row per (post, user); only the first inserts increments views_count.
     */
    public function handle(Post $post, User $viewer): bool
    {
        if ($viewer->id === $post->author_id) {
            return false;
        }

        return DB::transaction(function () use ($post, $viewer): bool {
            $view = PostView::query()->firstOrCreate(
                [
                    'post_id' => $post->id,
                    'user_id' => $viewer->id,
                ],
                [
                    'created_at' => now(),
                ],
            );

            if (! $view->wasRecentlyCreated) {
                return false;
            }

            $post->increment('views_count');

            return true;
        });
    }

    /**
     * @param  iterable<int, Post>  $posts
     */
    public function forFeed(iterable $posts, User $viewer): void
    {
        foreach ($posts as $post) {
            $this->handle($post, $viewer);
        }
    }
}
