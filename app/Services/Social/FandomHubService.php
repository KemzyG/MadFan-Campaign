<?php

namespace App\Services\Social;

use App\Enums\EventPhase;
use App\Models\Fandom;
use App\Models\FandomFollow;
use App\Models\MatchFixture;
use App\Models\PointTransaction;
use App\Models\Post;
use App\Models\Task;
use App\Models\User;
use App\Support\Social\EventCard;

/**
 * Aggregates everything the Fandom hub shows into one place: the app already
 * has feeds, a leaderboard, live Stages, fan challenges, and fixtures — this
 * service pulls the fandom-relevant slice of each rather than re-querying
 * from scratch, so the hub reads as a front door onto the rest of the app,
 * not a parallel copy of it.
 */
class FandomHubService
{
    public function __construct(
        private EventFeedService $events,
        private StageService $stage,
        private FeedService $feed,
        private FanLeaderboardService $leaderboard,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function header(Fandom $fandom, User $viewer): array
    {
        return [
            'id' => $fandom->id,
            'name' => $fandom->name,
            'slug' => $fandom->slug,
            'description' => $fandom->description,
            'icon' => $fandom->icon,
            'cover_image_url' => $fandom->cover_image_url,
            'fan_count' => FandomFollow::query()->where('fandom_id', $fandom->id)->count(),
            'is_following' => $viewer->isFollowingFandom($fandom),
        ];
    }

    /**
     * The "living stadium" strip — how alive the fandom is right now.
     *
     * @return array<string, mixed>
     */
    public function pulse(Fandom $fandom): array
    {
        $today = now()->toDateString();
        $memberIds = FandomFollow::query()->where('fandom_id', $fandom->id)->pluck('user_id');

        return [
            'fans_active_today' => User::query()
                ->whereIn('id', $memberIds)
                ->whereDate('last_login_at', $today)
                ->count(),
            'posts_today' => Post::query()
                ->whereNull('reply_to_id')
                ->whereDate('created_at', $today)
                ->count(),
            'live_discussions' => count($this->stage->presentLiveStages()),
            'challenges_active' => Task::query()->forFans()->where('is_active', true)->count(),
            'fans_earned_points_today' => PointTransaction::query()
                ->whereIn('user_id', $memberIds)
                ->whereDate('created_at', $today)
                ->distinct('user_id')
                ->count('user_id'),
        ];
    }

    /**
     * Top live/trending item for the hero — a live match, a live Stage, or
     * whatever's hottest right now. Falls back to the soonest upcoming item.
     *
     * @return array<string, mixed>|null
     */
    public function trending(User $viewer): ?array
    {
        $cards = $this->events->cards($viewer);

        /** @var EventCard|null $top */
        $top = $cards->firstWhere('phase', EventPhase::Live) ?? $cards->first();

        return $top?->toArray();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function liveFeed(User $viewer, int $limit = 20): array
    {
        return $this->events->cards($viewer)
            ->take($limit)
            ->map(fn (EventCard $card): array => $card->toArray())
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function challenges(int $limit = 4): array
    {
        return Task::query()
            ->forFans()
            ->where('is_active', true)
            ->orderByRaw('COALESCE(ends_at, starts_at) IS NULL')
            ->orderByRaw('COALESCE(ends_at, starts_at)')
            ->orderBy('display_order')
            ->limit($limit)
            ->get()
            ->map(fn (Task $task): array => [
                'id' => $task->id,
                'name' => $task->name,
                'description' => $task->description,
                'points' => (int) $task->points,
                'platform' => $task->platform,
                'href' => filled($task->external_url) ? $task->external_url : '/campaign',
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function feedExcerpt(User $viewer, int $limit = 5): array
    {
        $paginator = $this->feed->globalFeed($viewer);
        $presented = $this->feed->presentPaginator($paginator, $viewer);

        return [
            'posts' => array_slice($presented['data'], 0, $limit),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function leaderboardExcerpt(Fandom $fandom, User $viewer, int $limit = 5): array
    {
        return $this->leaderboard->present($viewer, $limit, $fandom->id);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function upcoming(int $limit = 5): array
    {
        return MatchFixture::query()
            ->upcoming()
            ->with(['homeClub:id,name,short,logo', 'awayClub:id,name,short,logo'])
            ->limit($limit)
            ->get()
            ->map(fn (MatchFixture $fixture): array => [
                'id' => $fixture->id,
                'home' => $fixture->homeClub?->only(['id', 'name', 'short']),
                'away' => $fixture->awayClub?->only(['id', 'name', 'short']),
                'kickoff_at' => $fixture->kickoff_at?->toIso8601String(),
                'venue' => $fixture->venue,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function membersPage(Fandom $fandom, int $page = 1, int $perPage = 30): array
    {
        $paginator = User::query()
            ->whereIn('id', FandomFollow::query()->where('fandom_id', $fandom->id)->pluck('user_id'))
            ->orderByDesc('total_points')
            ->paginate($perPage, ['id', 'name', 'handle', 'username', 'fan_id', 'avatar_path', 'total_points'], 'page', $page);

        return [
            'data' => collect($paginator->items())->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'handle' => $user->handle ?: $user->username ?: $user->fan_id,
                'avatar_url' => $user->avatar_url,
                'total_points' => (int) $user->total_points,
            ])->values()->all(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ];
    }
}
