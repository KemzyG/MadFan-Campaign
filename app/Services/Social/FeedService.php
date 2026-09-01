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
    public function globalFeed(?User $viewer): LengthAwarePaginator
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
     * Fandom-scoped terrace feed — the fandom equivalent of clubFeed().
     *
     * @return LengthAwarePaginator<int, Post>
     */
    public function fandomFeed(User $viewer, ?int $fandomId = null): LengthAwarePaginator
    {
        $fandomId ??= $viewer->favourite_fandom_id;

        return $this->baseFeedQuery($viewer)
            ->forFandom((int) $fandomId)
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
     * "Fans to follow" — a handful of onboarded fans the viewer doesn't
     * already follow, favouring their own fandom when there is one. Randomised
     * per call so the feed's floating suggestion strip doesn't always list
     * the same faces.
     *
     * @return list<array<string, mixed>>
     */
    public function suggestedFollows(?User $viewer, int $limit = 8): array
    {
        // A guest follows no one and has no fandom to prioritise — the query
        // degrades to "a handful of onboarded fans", no exclusion/ordering.
        $excludedIds = $viewer === null ? collect() : Follow::query()
            ->where('follower_id', $viewer->id)
            ->pluck('following_id')
            ->push($viewer->id)
            ->unique()
            ->values();

        $users = User::query()
            ->whereNotIn('id', $excludedIds)
            ->whereNotNull('social_onboarded_at')
            ->with('favouriteFandom:id,name,slug')
            ->when($viewer?->favourite_fandom_id, fn (Builder $query) => $query
                ->orderByRaw('favourite_fandom_id = ? desc', [$viewer->favourite_fandom_id]))
            ->inRandomOrder()
            ->limit($limit)
            ->get(['id', 'name', 'handle', 'username', 'fan_id', 'bio', 'favourite_fandom_id', 'updated_at']);

        return $users->map(fn (User $user): array => [
            'id' => $user->id,
            'name' => $user->name,
            'handle' => $user->handle ?: $user->username ?: $user->fan_id,
            'avatar_url' => $user->avatar_url,
            'bio' => $user->bio,
            'fandom' => $user->favouriteFandom ? [
                'name' => $user->favouriteFandom->name,
                'slug' => $user->favouriteFandom->slug,
            ] : null,
        ])->values()->all();
    }

    /**
     * @return LengthAwarePaginator<int, Post>
     */
    public function profilePosts(User $profile, ?User $viewer): LengthAwarePaginator
    {
        return $this->baseFeedQuery($viewer)
            ->where('author_id', $profile->id)
            ->paginate(self::PER_PAGE)
            ->withQueryString();
    }

    /**
     * @return Builder<Post>
     */
    protected function baseFeedQuery(?User $viewer): Builder
    {
        // A guest has never reported or hidden anything — nothing to exclude.
        $excludedIds = $viewer === null ? collect() : SocialReport::query()
            ->where('reporter_id', $viewer->id)
            ->where('target_type', SocialReportTarget::Post)
            ->pluck('target_id')
            ->merge(
                PostHide::query()->where('user_id', $viewer->id)->pluck('post_id')
            )
            ->unique()
            ->values();

        return Post::query()
            ->visible()
            ->topLevel()
            ->tap(fn (Builder $query) => $this->applyVisibilityScope($query, $viewer))
            ->when($excludedIds->isNotEmpty(), fn (Builder $query) => $query->whereNotIn('id', $excludedIds))
            ->with($this->feedWith($viewer))
            ->latest('id');
    }

    /**
     * Restrict a post query to what the viewer is allowed to see: public
     * posts, the viewer's own posts, fandom posts for a fandom the viewer
     * follows, or (legacy) club posts for a club the viewer belongs to.
     * `only_me` posts fall through to the author-only branch.
     *
     * @param  Builder<Post>  $query
     * @return Builder<Post>
     */
    public function applyVisibilityScope(Builder $query, ?User $viewer): Builder
    {
        // A guest has no posts of their own and belongs to no club/fandom —
        // only Public-visibility posts are theirs to see.
        if ($viewer === null) {
            return $query->where('visibility', PostVisibility::Public->value);
        }

        $clubIds = $this->viewerClubIds($viewer);
        $fandomIds = $this->viewerFandomIds($viewer);

        return $query->where(function (Builder $inner) use ($viewer, $clubIds, $fandomIds): void {
            $inner->where('visibility', PostVisibility::Public->value)
                ->orWhere('author_id', $viewer->id)
                ->when($fandomIds !== [], fn (Builder $q) => $q->orWhere(function (Builder $fandomQuery) use ($fandomIds): void {
                    $fandomQuery->where('visibility', PostVisibility::Fandom->value)
                        ->whereIn('fandom_id', $fandomIds);
                }))
                ->when($clubIds !== [], fn (Builder $q) => $q->orWhere(function (Builder $clubQuery) use ($clubIds): void {
                    $clubQuery->where('visibility', PostVisibility::Club->value)
                        ->whereIn('club_id', $clubIds);
                }));
        });
    }

    /**
     * Club ids the viewer belongs to (favourite club + memberships) — legacy,
     * only still load-bearing for posts made before the fandom move.
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
     * Fandom ids the viewer belongs to (favourite fandom + every fandom they
     * follow — see FandomFollow).
     *
     * @return list<int>
     */
    protected function viewerFandomIds(User $viewer): array
    {
        return collect([$viewer->favourite_fandom_id])
            ->merge($viewer->fandomFollows()->pluck('fandom_id'))
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
    public function canView(?User $viewer, Post $post): bool
    {
        return match ($post->visibility) {
            PostVisibility::Public => true,
            PostVisibility::OnlyMe => $viewer !== null && $post->author_id === $viewer->id,
            PostVisibility::Fandom => $viewer !== null && (
                $post->author_id === $viewer->id
                || in_array((int) $post->fandom_id, $this->viewerFandomIds($viewer), true)
            ),
            PostVisibility::Club => $viewer !== null && (
                $post->author_id === $viewer->id
                || in_array((int) $post->club_id, $this->viewerClubIds($viewer), true)
            ),
        };
    }

    /**
     * Whether the viewer may reply, per the thread root's reply-scope setting.
     * Everyone → anyone; Following → only people the root author follows;
     * Tagged → only users tagged on the root. The author can always reply.
     */
    public function viewerCanReply(?User $viewer, Post $post): bool
    {
        $rootId = $post->root_id ?? $post->id;
        $root = $rootId === $post->id ? $post : (Post::query()->find($rootId) ?? $post);

        if ($viewer !== null && $root->author_id === $viewer->id) {
            return true;
        }

        return match ($root->reply_scope) {
            ReplyScope::Everyone => true,
            // A guest follows and is tagged on nothing — deterministically
            // excluded from both restricted scopes, not just "unknown yet".
            ReplyScope::Following => $viewer !== null && Follow::query()
                ->where('follower_id', $root->author_id)
                ->where('following_id', $viewer->id)
                ->exists(),
            ReplyScope::Tagged => $viewer !== null && $root->taggedUsers()->whereKey($viewer->id)->exists(),
        };
    }

    /**
     * @return array<int, mixed>
     */
    protected function feedWith(?User $viewer): array
    {
        $with = [
            'author:id,name,handle,username,fan_id,avatar_path,favourite_club_id,favourite_fandom_id',
            'club:id,name,short,logo',
            'fandom:id,name,slug',
            'media',
            'stage.host:id,name,handle,username,fan_id,avatar_path,avatar_emoji,updated_at',
            'taggedUsers:id,name,handle,username,fan_id,avatar_path,updated_at',
            'quoteOf.author:id,name,handle,username,fan_id',
            'quoteOf.club:id,name,short,logo',
            'quoteOf.fandom:id,name,slug',
            'quoteOf.media',
            'repostOf.author:id,name,handle,username,fan_id',
            'repostOf.club:id,name,short,logo',
            'repostOf.fandom:id,name,slug',
            'repostOf.media',
        ];

        // A guest has no likes/bookmarks/hides to load — Post::isLikedBy() and
        // friends already return false on a null viewer without needing the
        // relation loaded at all, so skip these three queries entirely.
        if ($viewer !== null) {
            $with['likes'] = fn ($query) => $query->where('user_id', $viewer->id);
            $with['bookmarks'] = fn ($query) => $query->where('user_id', $viewer->id);
            $with['hides'] = fn ($query) => $query->where('user_id', $viewer->id);
        }

        return $with;
    }

    /**
     * @return Collection<int, Post>
     */
    public function threadReplies(Post $root, ?User $viewer): Collection
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
    public function followingMapForPosts(iterable $posts, ?User $viewer): array
    {
        if ($viewer === null) {
            return [];
        }

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
    public function presentPost(Post $post, ?User $viewer, array $followingMap = []): array
    {
        $author = $post->author;
        $isOwn = $viewer !== null && $viewer->id === $post->author_id;
        $viewerFollowsAuthor = $isOwn || $viewer === null
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
                'avatar_url' => $author->avatar_url,
            ] : null,
            'club' => $post->club ? [
                'id' => $post->club->id,
                'name' => $post->club->name,
                'short' => $post->club->short,
                'logo_url' => $post->club->logo_url,
            ] : null,
            'fandom' => $post->fandom ? [
                'id' => $post->fandom->id,
                'name' => $post->fandom->name,
                'slug' => $post->fandom->slug,
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
            'can_delete' => $viewer !== null && $viewer->can('delete', $post),
            'can_repost' => ! $isOwn && $post->reply_to_id === null,
            'can_hide' => $viewer !== null && $viewer->can('hide', $post),
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
            'fandom' => $post->fandom ? [
                'id' => $post->fandom->id,
                'name' => $post->fandom->name,
                'slug' => $post->fandom->slug,
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
    public function presentPaginator(LengthAwarePaginator $paginator, ?User $viewer): array
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
