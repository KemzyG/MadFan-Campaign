<?php

namespace App\Services\Social;

use App\Enums\PostVisibility;
use App\Enums\ReplyScope;
use App\Enums\SocialReportTarget;
use App\Models\Follow;
use App\Models\Post;
use App\Models\PostHide;
use App\Models\PostMedia;
use App\Models\SocialReport;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class FeedService
{
    public const MAX_BODY_LENGTH = 280;

    public const PER_PAGE = 20;

    public const MAX_IMAGES = 4;

    public const MAX_IMAGE_KB = 5120;

    public const MAX_VIDEO_KB = 30720;

    /**
     * Global feed: top-level posts from every club (not scoped to the viewer's club).
     *
     * @return LengthAwarePaginator<int, Post>
     */
    public function globalFeed(User $viewer): LengthAwarePaginator
    {
        return $this->baseFeedQuery($viewer)
            ->paginate(self::PER_PAGE)
            ->withQueryString();
    }

    /**
     * Club-scoped terrace feed (kept for callers that still need a single-club timeline).
     *
     * @return LengthAwarePaginator<int, Post>
     */
    public function clubFeed(User $viewer, ?int $clubId = null): LengthAwarePaginator
    {
        $clubId ??= $viewer->favourite_club_id;

        return $this->baseFeedQuery($viewer)
            ->forClub((int) $clubId)
            ->paginate(self::PER_PAGE)
            ->withQueryString();
    }

    /**
     * Following feed: top-level posts from followed users (and the viewer).
     *
     * @return LengthAwarePaginator<int, Post>
     */
    public function followingFeed(User $viewer): LengthAwarePaginator
    {
        $authorIds = Follow::query()
            ->where('follower_id', $viewer->id)
            ->pluck('following_id')
            ->push($viewer->id)
            ->unique()
            ->values()
            ->all();

        return $this->baseFeedQuery($viewer)
            ->whereIn('author_id', $authorIds)
            ->paginate(self::PER_PAGE)
            ->withQueryString();
    }

    /**
     * @return LengthAwarePaginator<int, Post>
     */
    public function profilePosts(User $profile, User $viewer): LengthAwarePaginator
    {
        return $this->baseFeedQuery($viewer)
            ->where('author_id', $profile->id)
            ->paginate(self::PER_PAGE)
            ->withQueryString();
    }

    /**
     * @return Builder<Post>
     */
    protected function baseFeedQuery(User $viewer): Builder
    {
        $reportedIds = SocialReport::query()
            ->where('reporter_id', $viewer->id)
            ->where('target_type', SocialReportTarget::Post)
            ->pluck('target_id');

        $hiddenIds = PostHide::query()
            ->where('user_id', $viewer->id)
            ->pluck('post_id');

        $excludedIds = $reportedIds->merge($hiddenIds)->unique()->values();

        return Post::query()
            ->visible()
            ->topLevel()
            ->tap(fn (Builder $query) => $this->applyVisibilityScope($query, $viewer))
            ->when($excludedIds->isNotEmpty(), fn (Builder $query) => $query->whereNotIn('id', $excludedIds))
            ->with($this->feedWith($viewer))
            ->latest('id');
    }

    /**
     * Restrict a post query to what the viewer is allowed to see:
     * public posts, the viewer's own posts, or club posts for a club the
     * viewer belongs to. `only_me` posts fall through to the author-only branch.
     *
     * @param  Builder<Post>  $query
     * @return Builder<Post>
     */
    public function applyVisibilityScope(Builder $query, User $viewer): Builder
    {
        $clubIds = $this->viewerClubIds($viewer);

        return $query->where(function (Builder $inner) use ($viewer, $clubIds): void {
            $inner->where('visibility', PostVisibility::Public->value)
                ->orWhere('author_id', $viewer->id)
                ->when($clubIds !== [], fn (Builder $q) => $q->orWhere(function (Builder $clubQuery) use ($clubIds): void {
                    $clubQuery->where('visibility', PostVisibility::Club->value)
                        ->whereIn('club_id', $clubIds);
                }));
        });
    }

    /**
     * Club ids the viewer belongs to (favourite club + memberships).
     *
     * @return list<int>
     */
    protected function viewerClubIds(User $viewer): array
    {
        return collect([$viewer->favourite_club_id])
            ->merge($viewer->clubMemberships()->pluck('club_id'))
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }

    /**
     * Whether a single post is visible to the viewer (mirrors applyVisibilityScope
     * for the single-post / thread route via PostPolicy::view).
     */
    public function canView(User $viewer, Post $post): bool
    {
        return match ($post->visibility) {
            PostVisibility::Public => true,
            PostVisibility::OnlyMe => $post->author_id === $viewer->id,
            PostVisibility::Club => $post->author_id === $viewer->id
                || in_array((int) $post->club_id, $this->viewerClubIds($viewer), true),
        };
    }

    /**
     * Whether the viewer may reply, per the thread root's reply-scope setting.
     * Everyone → anyone; Following → only people the root author follows;
     * Tagged → only users tagged on the root. The author can always reply.
     */
    public function viewerCanReply(User $viewer, Post $post): bool
    {
        $rootId = $post->root_id ?? $post->id;
        $root = $rootId === $post->id ? $post : (Post::query()->find($rootId) ?? $post);

        if ($root->author_id === $viewer->id) {
            return true;
        }

        return match ($root->reply_scope) {
            ReplyScope::Everyone => true,
            ReplyScope::Following => Follow::query()
                ->where('follower_id', $root->author_id)
                ->where('following_id', $viewer->id)
                ->exists(),
            ReplyScope::Tagged => $root->taggedUsers()->whereKey($viewer->id)->exists(),
        };
    }

    /**
     * @return array<int, mixed>
     */
    protected function feedWith(User $viewer): array
    {
        return [
            'author:id,name,handle,username,fan_id,avatar_path,favourite_club_id',
            'club:id,name,short,logo',
            'media',
            'stage.host:id,name,handle,username,fan_id,avatar_path,avatar_emoji,updated_at',
            'taggedUsers:id,name,handle,username,fan_id,avatar_path,updated_at',
            'likes' => fn ($query) => $query->where('user_id', $viewer->id),
            'bookmarks' => fn ($query) => $query->where('user_id', $viewer->id),
            'hides' => fn ($query) => $query->where('user_id', $viewer->id),
            'quoteOf.author:id,name,handle,username,fan_id',
            'quoteOf.club:id,name,short,logo',
            'quoteOf.media',
            'repostOf.author:id,name,handle,username,fan_id',
            'repostOf.club:id,name,short,logo',
            'repostOf.media',
        ];
    }

    /**
     * @return Collection<int, Post>
     */
    public function threadReplies(Post $root, User $viewer): Collection
    {
        $threadRootId = $root->root_id ?? $root->id;

        return Post::query()
            ->visible()
            ->where(function ($query) use ($threadRootId, $root): void {
                $query->where('root_id', $threadRootId)
                    ->orWhere('reply_to_id', $root->id);
            })
            ->where('id', '!=', $root->id)
            ->with($this->feedWith($viewer))
            ->orderBy('id')
            ->limit(100)
            ->get();
    }

    /**
     * Map of author_id => whether the viewer follows that author.
     *
     * @param  Collection<int, Post>|list<Post>  $posts
     * @return array<int, bool>
     */
    public function followingMapForPosts(iterable $posts, User $viewer): array
    {
        $authorIds = collect($posts)
            ->pluck('author_id')
            ->filter(fn ($id) => $id && $id !== $viewer->id)
            ->unique()
            ->values();

        if ($authorIds->isEmpty()) {
            return [];
        }

        return Follow::query()
            ->where('follower_id', $viewer->id)
            ->whereIn('following_id', $authorIds)
            ->pluck('following_id')
            ->flip()
            ->map(fn () => true)
            ->all();
    }

    /**
     * @param  array<int, bool>  $followingMap
     * @return array<string, mixed>
     */
    public function presentPost(Post $post, User $viewer, array $followingMap = []): array
    {
        $author = $post->author;
        $isOwn = $viewer->id === $post->author_id;
        $viewerFollowsAuthor = $isOwn
            ? false
            : (bool) ($followingMap[$post->author_id] ?? Follow::query()
                ->where('follower_id', $viewer->id)
                ->where('following_id', $post->author_id)
                ->exists());

        return [
            'id' => $post->id,
            'body' => $post->body,
            'type' => $post->type->value,
            'visibility' => $post->visibility->value,
            'reply_scope' => $post->reply_scope->value,
            'likes_count' => $post->likes_count,
            'replies_count' => $post->replies_count,
            'reposts_count' => $post->reposts_count,
            'quotes_count' => $post->quotes_count,
            'views_count' => $post->views_count ?? 0,
            'liked_by_viewer' => $post->isLikedBy($viewer),
            'bookmarked_by_viewer' => $post->isBookmarkedBy($viewer),
            'hidden_by_viewer' => $post->isHiddenBy($viewer),
            'viewer_follows_author' => $viewerFollowsAuthor,
            'is_own' => $isOwn,
            'reply_to_id' => $post->reply_to_id,
            'root_id' => $post->root_id,
            'published_at' => $post->published_at?->toIso8601String(),
            'created_at' => $post->created_at?->toIso8601String(),
            'author' => $author ? [
                'id' => $author->id,
                'name' => $author->name,
                'handle' => $author->handle ?: $author->username ?: $author->fan_id,
                'fan_id' => $author->fan_id,
            ] : null,
            'club' => $post->club ? [
                'id' => $post->club->id,
                'name' => $post->club->name,
                'short' => $post->club->short,
                'logo_url' => $post->club->logo_url,
            ] : null,
            'media' => $post->relationLoaded('media')
                ? $post->media->map(fn (PostMedia $media) => [
                    'id' => $media->id,
                    'type' => $media->type->value,
                    'url' => $media->url,
                    'width' => $media->width,
                    'height' => $media->height,
                    'sort_order' => $media->sort_order,
                ])->values()->all()
                : [],
            'quote_of' => $post->quoteOf ? $this->presentEmbeddedPost($post->quoteOf) : null,
            'repost_of' => $post->repostOf ? $this->presentEmbeddedPost($post->repostOf) : null,
            'stage' => $post->stage
                ? app(StageService::class)->presentStageCard($post->stage)
                : null,
            'tagged' => $post->relationLoaded('taggedUsers')
                ? $post->taggedUsers->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'handle' => $user->handle ?: $user->username ?: $user->fan_id,
                    'avatar_url' => $user->avatar_url,
                ])->values()->all()
                : [],
            'can_delete' => $viewer->can('delete', $post),
            'can_repost' => $viewer->id !== $post->author_id && $post->reply_to_id === null,
            'can_hide' => $viewer->can('hide', $post),
            'can_follow_author' => ! $isOwn && $author !== null,
            'viewer_can_reply' => $this->viewerCanReply($viewer, $post),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function presentEmbeddedPost(Post $post): array
    {
        $author = $post->author;

        return [
            'id' => $post->id,
            'body' => $post->body,
            'author' => $author ? [
                'id' => $author->id,
                'name' => $author->name,
                'handle' => $author->handle ?: $author->username ?: $author->fan_id,
            ] : null,
            'club' => $post->club ? [
                'id' => $post->club->id,
                'name' => $post->club->name,
                'short' => $post->club->short,
            ] : null,
            'media' => $post->relationLoaded('media')
                ? $post->media->map(fn (PostMedia $media) => [
                    'id' => $media->id,
                    'type' => $media->type->value,
                    'url' => $media->url,
                ])->values()->all()
                : [],
        ];
    }

    /**
     * @param  LengthAwarePaginator<int, Post>  $paginator
     * @return array{data: list<array<string, mixed>>, meta: array<string, mixed>, links: array<string, string|null>}
     */
    public function presentPaginator(LengthAwarePaginator $paginator, User $viewer): array
    {
        $items = collect($paginator->items());
        $followingMap = $this->followingMapForPosts($items, $viewer);

        return [
            'data' => $items
                ->map(fn (Post $post) => $this->presentPost($post, $viewer, $followingMap))
                ->values()
                ->all(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'links' => [
                'next' => $paginator->nextPageUrl(),
                'prev' => $paginator->previousPageUrl(),
            ],
        ];
    }
}
