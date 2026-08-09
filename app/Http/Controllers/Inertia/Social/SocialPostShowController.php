<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Actions\Social\RecordPostView;
use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\User;
use App\Services\Social\FeedService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialPostShowController extends Controller
{
    public function __invoke(
        Request $request,
        Post $post,
        FeedService $feedService,
        RecordPostView $recordPostView,
    ): Response {
        $this->authorize('view', $post);

        /** @var User $viewer */
        $viewer = $request->user();

        $root = $post->root_id
            ? Post::query()->visible()->with([
                'author:id,name,handle,username,fan_id,avatar_path,favourite_club_id',
                'club:id,name,short,logo',
                'media',
                'likes' => fn ($query) => $query->where('user_id', $viewer->id),
                'bookmarks' => fn ($query) => $query->where('user_id', $viewer->id),
                'hides' => fn ($query) => $query->where('user_id', $viewer->id),
                'quoteOf.author:id,name,handle,username,fan_id',
                'quoteOf.media',
                'repostOf.author:id,name,handle,username,fan_id',
                'repostOf.media',
            ])->findOrFail($post->root_id)
            : $post->loadMissing([
                'author:id,name,handle,username,fan_id,avatar_path,favourite_club_id',
                'club:id,name,short,logo',
                'media',
                'likes' => fn ($query) => $query->where('user_id', $viewer->id),
                'bookmarks' => fn ($query) => $query->where('user_id', $viewer->id),
                'hides' => fn ($query) => $query->where('user_id', $viewer->id),
                'quoteOf.author:id,name,handle,username,fan_id',
                'quoteOf.media',
                'repostOf.author:id,name,handle,username,fan_id',
                'repostOf.media',
            ]);

        $recordPostView->handle($root, $viewer);
        $root->refresh();

        $replies = $feedService->threadReplies($root, $viewer);
        $followingMap = $feedService->followingMapForPosts(
            collect([$root])->merge($replies),
            $viewer,
        );

        return Inertia::render('Social/PostShow', [
            'post' => $feedService->presentPost($root, $viewer, $followingMap),
            'replies' => $replies
                ->map(fn (Post $reply) => $feedService->presentPost($reply, $viewer, $followingMap))
                ->values()
                ->all(),
            'max_body_length' => FeedService::MAX_BODY_LENGTH,
        ]);
    }
}
