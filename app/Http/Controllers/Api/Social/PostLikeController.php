<?php

namespace App\Http\Controllers\Api\Social;

use App\Actions\Social\AwardSocialPoints;
use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostLike;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PostLikeController extends Controller
{
    public function store(Request $request, Post $post, AwardSocialPoints $awardSocialPoints): JsonResponse
    {
        $this->authorize('like', $post);

        $user = $request->user();
        $shouldAward = false;

        DB::transaction(function () use ($post, $user, &$shouldAward): void {
            $created = PostLike::query()->firstOrCreate(
                [
                    'post_id' => $post->id,
                    'user_id' => $user->id,
                ],
                [
                    'created_at' => now(),
                ],
            );

            if ($created->wasRecentlyCreated) {
                $post->increment('likes_count');
                $shouldAward = true;
            }
        });

        if ($shouldAward) {
            $post->loadMissing('author');

            if ($post->author !== null) {
                // After commit so a points CHECK failure cannot abort the like.
                $awardSocialPoints->forLikeReceived($post->author, $post->id, $user->id);
            }
        }

        $post->refresh();

        return response()->json([
            'message' => 'Post liked.',
            'liked' => true,
            'likes_count' => (int) $post->likes_count,
        ]);
    }

    public function destroy(Request $request, Post $post): JsonResponse
    {
        $this->authorize('like', $post);

        $user = $request->user();

        DB::transaction(function () use ($post, $user): void {
            $deleted = PostLike::query()
                ->where('post_id', $post->id)
                ->where('user_id', $user->id)
                ->delete();

            if ($deleted > 0 && $post->likes_count > 0) {
                $post->decrement('likes_count');
            }
        });

        $post->refresh();

        return response()->json([
            'message' => 'Like removed.',
            'liked' => false,
            'likes_count' => (int) $post->likes_count,
        ]);
    }
}
