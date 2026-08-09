<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostBookmark;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SocialPostBookmarkController extends Controller
{
    public function store(Request $request, Post $post): RedirectResponse
    {
        $this->authorize('view', $post);

        PostBookmark::query()->firstOrCreate(
            [
                'post_id' => $post->id,
                'user_id' => $request->user()->id,
            ],
            [
                'created_at' => now(),
            ],
        );

        return back()->with('success', 'Bookmarked.');
    }

    public function destroy(Request $request, Post $post): RedirectResponse
    {
        $this->authorize('view', $post);

        PostBookmark::query()
            ->where('post_id', $post->id)
            ->where('user_id', $request->user()->id)
            ->delete();

        return back()->with('success', 'Bookmark removed.');
    }
}
