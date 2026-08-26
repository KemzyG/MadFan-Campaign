<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostHide;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SocialPostHideController extends Controller
{
    /**
     * Mark post as "Not interested" — durable preference hides it from the viewer's feeds.
     */
    public function store(Request $request, Post $post): RedirectResponse
    {
        $this->authorize('hide', $post);

        /** @var User $viewer */
        $viewer = $request->user();

        PostHide::query()->firstOrCreate(
            [
                'post_id' => $post->id,
                'user_id' => $viewer->id,
            ],
            [
                'reason' => 'not_interested',
                'created_at' => now(),
            ],
        );

        return back();
    }

    /**
     * "Interested" clears a prior not-interested hide so the post can reappear in feeds.
     */
    public function destroy(Request $request, Post $post): RedirectResponse
    {
        $this->authorize('view', $post);

        PostHide::query()
            ->where('post_id', $post->id)
            ->where('user_id', $request->user()->id)
            ->delete();

        return back();
    }
}
