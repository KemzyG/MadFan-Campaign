<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Actions\Social\AwardSocialPoints;
use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostLike;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SocialPostLikeController extends Controller
{
    public function store(Request $request, Post $post, AwardSocialPoints $awardSocialPoints): RedirectResponse
    {
        $this->authorize('like', $post);

        $user = $request->user();

        DB::transaction(function () use ($post, $user, $awardSocialPoints): void {
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
                $post->loadMissing('author');

                if ($post->author !== null) {
                    $awardSocialPoints->forLikeReceived($post->author, $post->id, $user->id);
                }
            }
        });

        return back();
    }

    public function destroy(Request $request, Post $post): RedirectResponse
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

        return back();
    }
}
