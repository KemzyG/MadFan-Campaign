<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Actions\Social\CreateSocialPost;
use App\Actions\Social\QuoteSocialPost;
use App\Actions\Social\RepostSocialPost;
use App\Http\Controllers\Controller;
use App\Http\Requests\Social\StoreSocialPostRequest;
use App\Http\Requests\Social\StoreSocialQuoteRequest;
use App\Http\Requests\Social\StoreSocialReplyRequest;
use App\Models\Post;
use App\Services\Social\FeedService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SocialPostController extends Controller
{
    public function store(StoreSocialPostRequest $request, CreateSocialPost $createSocialPost): RedirectResponse
    {
        $validated = $request->validated();
        $images = $request->file('images', []);

        $createSocialPost->handle($request->user(), [
            'body' => $validated['body'] ?? '',
            'images' => is_array($images) ? $images : [],
            'visibility' => $validated['visibility'] ?? null,
            'reply_scope' => $validated['reply_scope'] ?? null,
            'tagged' => $validated['tagged'] ?? [],
        ]);

        return redirect()
            ->route('social.feed')
            ->with('success', 'Posted to the terrace.');
    }

    public function reply(
        StoreSocialReplyRequest $request,
        Post $post,
        CreateSocialPost $createSocialPost,
        FeedService $feedService,
    ): RedirectResponse {
        if (! $feedService->viewerCanReply($request->user(), $post)) {
            return redirect()
                ->route('social.posts.show', $post->root_id ?? $post->id)
                ->with('error', 'The author limited who can reply to this post.');
        }

        $createSocialPost->handle($request->user(), [
            ...$request->validated(),
            'reply_to_id' => $post->id,
        ]);

        return redirect()
            ->route('social.posts.show', $post->root_id ?? $post->id)
            ->with('success', 'Reply sent.');
    }

    public function repost(Request $request, Post $post, RepostSocialPost $repostSocialPost): RedirectResponse
    {
        $this->authorize('view', $post);

        $repostSocialPost->handle($request->user(), $post);

        return redirect()
            ->route('social.feed')
            ->with('success', 'Reposted to your terrace.');
    }

    public function quote(
        StoreSocialQuoteRequest $request,
        Post $post,
        QuoteSocialPost $quoteSocialPost,
    ): RedirectResponse {
        $this->authorize('view', $post);

        $quoteSocialPost->handle($request->user(), $post, $request->validated('body'));

        return redirect()
            ->route('social.feed')
            ->with('success', 'Quote posted.');
    }

    public function destroy(Request $request, Post $post): RedirectResponse
    {
        $this->authorize('delete', $post);

        $parentId = $post->reply_to_id;

        if ($parentId !== null) {
            Post::query()->whereKey($parentId)->decrement('replies_count');
        }

        $post->delete();

        if ($parentId !== null) {
            return redirect()
                ->route('social.posts.show', $post->root_id ?? $parentId)
                ->with('success', 'Reply removed.');
        }

        return redirect()
            ->route('social.feed')
            ->with('success', 'Post removed.');
    }
}
