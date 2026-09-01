<?php

namespace App\Services\Analytics;

use App\Enums\EventPhase;
use App\Enums\LiveStageStatus;
use App\Enums\PointSourceType;
use App\Enums\StageStatus;
use App\Models\DailyClaim;
use App\Models\LiveStage;
use App\Models\LiveStageComment;
use App\Models\LiveStageViewerSession;
use App\Models\LoyaltyTier;
use App\Models\MatchFixture;
use App\Models\PointTransaction;
use App\Models\Poll;
use App\Models\PollVote;
use App\Models\Post;
use App\Models\PostLike;
use App\Models\Referral;
use App\Models\Showdown;
use App\Models\ShowdownVote;
use App\Models\SocialAnnouncement;
use App\Models\Stage;
use App\Models\StageMessage;
use App\Models\StageParticipant;
use App\Models\StageReaction;
use App\Models\Task;
use App\Models\User;
use App\Models\UserTaskProgress;
use App\Services\Social\EventFeedService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    /**
     * @return array<int, int>
     */
    public function dailySeries(string $model, string $dateColumn, int $days = 30): array
    {
        $table = (new $model)->getTable();

        $rows = DB::table($table)
            ->selectRaw("date({$dateColumn}) as series_date, count(*) as total")
            ->where($dateColumn, '>=', now()->subDays($days - 1)->startOfDay())
            ->groupBy('series_date')
            ->orderBy('series_date')
            ->pluck('total', 'series_date');

        return $this->fillDateSeries($rows, $days);
    }

    /**
     * @return array{labels: array<int, string>, values: array<int, int|float>}
     */
    public function pointsAwardedSeries(int $days = 30): array
    {
        $rows = PointTransaction::query()
            ->selectRaw('date(created_at) as series_date, sum(amount) as total_amount')
            ->where('amount', '>', 0)
            ->where('created_at', '>=', now()->subDays($days - 1)->startOfDay())
            ->groupBy('series_date')
            ->orderBy('series_date')
            ->pluck('total_amount', 'series_date');

        $values = $this->fillDateSeries($rows, $days);

        return [
            'labels' => $this->dateLabels($days),
            'values' => array_map('intval', $values),
        ];
    }

    /**
     * @return array{labels: array<int, string>, values: array<int, int>}
     */
    public function dailyClaimsSeries(int $days = 30): array
    {
        $rows = DailyClaim::query()
            ->selectRaw('date(claim_date) as series_date, count(*) as total')
            ->where('claim_date', '>=', now()->subDays($days - 1)->startOfDay()->toDateString())
            ->groupBy('series_date')
            ->orderBy('series_date')
            ->pluck('total', 'series_date');

        return [
            'labels' => $this->dateLabels($days),
            'values' => array_map('intval', $this->fillDateSeries($rows, $days)),
        ];
    }

    /**
     * Fan accounts with a login, post, or like on each day.
     *
     * @return array{labels: array<int, string>, values: array<int, int>}
     */
    public function dailyActiveFansSeries(int $days = 14): array
    {
        $since = now()->subDays($days - 1)->startOfDay();
        $adminIds = $this->adminUserIds();
        $buckets = [];

        for ($i = $days - 1; $i >= 0; $i--) {
            $buckets[now()->subDays($i)->format('Y-m-d')] = [];
        }

        $loginQuery = User::query()
            ->fanAccounts()
            ->where('last_login_at', '>=', $since)
            ->whereNotNull('last_login_at');

        if ($adminIds !== []) {
            $loginQuery->whereNotIn('id', $adminIds);
        }

        foreach ($loginQuery->get(['id', 'last_login_at']) as $user) {
            $date = $user->last_login_at?->format('Y-m-d');
            if ($date !== null && array_key_exists($date, $buckets)) {
                $buckets[$date][$user->id] = true;
            }
        }

        $postQuery = Post::query()
            ->where('created_at', '>=', $since)
            ->whereNotNull('author_id');

        if ($adminIds !== []) {
            $postQuery->whereNotIn('author_id', $adminIds);
        }

        foreach ($postQuery->get(['author_id', 'created_at']) as $post) {
            $date = $post->created_at?->format('Y-m-d');
            if ($date !== null && array_key_exists($date, $buckets)) {
                $buckets[$date][$post->author_id] = true;
            }
        }

        $likeQuery = PostLike::query()->where('created_at', '>=', $since);

        if ($adminIds !== []) {
            $likeQuery->whereNotIn('user_id', $adminIds);
        }

        foreach ($likeQuery->get(['user_id', 'created_at']) as $like) {
            $date = $like->created_at?->format('Y-m-d');
            if ($date !== null && array_key_exists($date, $buckets)) {
                $buckets[$date][$like->user_id] = true;
            }
        }

        $rows = collect($buckets)->map(fn (array $users): int => count($users));

        return [
            'labels' => $this->dateLabels($days),
            'values' => array_map('intval', $this->fillDateSeries($rows, $days)),
        ];
    }

    /**
     * @return array{labels: array<int, string>, values: array<int, int>}
     */
    public function dailyPostsSeries(int $days = 14): array
    {
        $rows = Post::query()
            ->selectRaw('date(created_at) as series_date, count(*) as total')
            ->whereNull('reply_to_id')
            ->where('created_at', '>=', now()->subDays($days - 1)->startOfDay())
            ->groupBy('series_date')
            ->orderBy('series_date')
            ->pluck('total', 'series_date');

        return [
            'labels' => $this->dateLabels($days),
            'values' => array_map('intval', $this->fillDateSeries($rows, $days)),
        ];
    }

    /**
     * Likes plus replies per day.
     *
     * @return array{labels: array<int, string>, values: array<int, int>}
     */
    public function dailyEngagementSeries(int $days = 14): array
    {
        $since = now()->subDays($days - 1)->startOfDay()->toDateTimeString();

        $rows = collect(DB::select(
            <<<'SQL'
            SELECT series_date, SUM(total) AS total FROM (
                SELECT DATE(created_at) AS series_date, COUNT(*) AS total
                FROM post_likes
                WHERE created_at >= ?
                GROUP BY DATE(created_at)
                UNION ALL
                SELECT DATE(created_at) AS series_date, COUNT(*) AS total
                FROM posts
                WHERE created_at >= ?
                  AND reply_to_id IS NOT NULL
                  AND deleted_at IS NULL
                GROUP BY DATE(created_at)
            ) AS engagement
            GROUP BY series_date
            ORDER BY series_date
            SQL,
            [$since, $since],
        ))->mapWithKeys(fn ($row) => [$row->series_date => (int) $row->total]);

        return [
            'labels' => $this->dateLabels($days),
            'values' => array_map('intval', $this->fillDateSeries($rows, $days)),
        ];
    }

    public function dailyActiveFansToday(): int
    {
        $today = today()->toDateString();
        $adminIds = $this->adminUserIds();

        $loginQuery = User::query()->fanAccounts()->whereDate('last_login_at', $today);
        $postAuthors = Post::query()->whereDate('created_at', $today)->whereNotNull('author_id');
        $likers = PostLike::query()->whereDate('created_at', $today);

        if ($adminIds !== []) {
            $loginQuery->whereNotIn('id', $adminIds);
            $postAuthors->whereNotIn('author_id', $adminIds);
            $likers->whereNotIn('user_id', $adminIds);
        }

        return collect([
            $loginQuery->pluck('id'),
            $postAuthors->pluck('author_id'),
            $likers->pluck('user_id'),
        ])->flatten()->unique()->count();
    }

    public function dailyPostsToday(): int
    {
        return Post::query()
            ->whereNull('reply_to_id')
            ->whereDate('created_at', today())
            ->count();
    }

    public function dailyEngagementToday(): int
    {
        $likes = PostLike::query()->whereDate('created_at', today())->count();
        $replies = Post::query()
            ->whereNotNull('reply_to_id')
            ->whereDate('created_at', today())
            ->count();

        return $likes + $replies;
    }

    public function dailyActiveLiveToday(): int
    {
        $socialStages = Stage::query()
            ->where(function ($query): void {
                $query->where('status', StageStatus::Live)
                    ->orWhereDate('started_at', today());
            })
            ->count();

        $liveStages = LiveStage::query()
            ->where(function ($query): void {
                $query->where('status', LiveStageStatus::Live)
                    ->orWhereDate('started_at', today());
            })
            ->count();

        return $socialStages + $liveStages;
    }

    public function dailyLiveParticipantsToday(): int
    {
        $stageParticipants = StageParticipant::query()
            ->whereDate('joined_at', today())
            ->distinct()
            ->count('user_id');

        $liveViewers = LiveStageViewerSession::query()
            ->whereDate('joined_at', today())
            ->distinct()
            ->count('user_id');

        return $stageParticipants + $liveViewers;
    }

    public function dailyEventsToday(): int
    {
        $announcements = SocialAnnouncement::query()
            ->where(function ($query): void {
                $query->whereDate('published_at', today())
                    ->orWhere(function ($inner): void {
                        $inner->whereNull('published_at')
                            ->whereDate('created_at', today());
                    });
            })
            ->count();

        $showdowns = Showdown::query()->whereDate('created_at', today())->count();
        $polls = Poll::query()->whereDate('created_at', today())->count();
        $fixtures = MatchFixture::query()->whereDate('kickoff_at', today())->count();

        return $announcements + $showdowns + $polls + $fixtures;
    }

    public function dailyOtherActivitiesToday(): int
    {
        return StageMessage::query()->whereDate('created_at', today())->count()
            + LiveStageComment::query()->whereDate('created_at', today())->whereNull('deleted_at')->count()
            + PollVote::query()->whereDate('created_at', today())->count()
            + ShowdownVote::query()->whereDate('created_at', today())->count()
            + StageReaction::query()->whereDate('created_at', today())->count();
    }

    public function activeEventsNow(): int
    {
        return app(EventFeedService::class)
            ->cards(null)
            ->filter(fn ($card) => $card->phase === EventPhase::Live)
            ->count();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function activeEventsList(int $limit = 10): array
    {
        return app(EventFeedService::class)
            ->cards(null)
            ->filter(fn ($card) => $card->phase === EventPhase::Live)
            ->take($limit)
            ->map(fn ($card) => $card->toArray())
            ->values()
            ->all();
    }

    /**
     * Live rooms that started on each day.
     *
     * @return array{labels: array<int, string>, values: array<int, int>}
     */
    public function dailyActiveLiveSeries(int $days = 14): array
    {
        $since = now()->subDays($days - 1)->startOfDay();

        $stageRows = Stage::query()
            ->selectRaw('date(started_at) as series_date, count(*) as total')
            ->whereNotNull('started_at')
            ->where('started_at', '>=', $since)
            ->groupBy('series_date')
            ->pluck('total', 'series_date');

        $liveRows = LiveStage::query()
            ->selectRaw('date(started_at) as series_date, count(*) as total')
            ->whereNotNull('started_at')
            ->where('started_at', '>=', $since)
            ->groupBy('series_date')
            ->pluck('total', 'series_date');

        $merged = collect($stageRows)->map(function ($total, $date) use ($liveRows) {
            return (int) $total + (int) ($liveRows[$date] ?? 0);
        });

        foreach ($liveRows as $date => $total) {
            if (! $merged->has($date)) {
                $merged[$date] = (int) $total;
            }
        }

        return [
            'labels' => $this->dateLabels($days),
            'values' => array_map('intval', $this->fillDateSeries($merged, $days)),
        ];
    }

    /**
     * @return array{labels: array<int, string>, values: array<int, int>}
     */
    public function dailyEventsSeries(int $days = 14): array
    {
        $since = now()->subDays($days - 1)->startOfDay()->toDateTimeString();

        $rows = collect(DB::select(
            <<<'SQL'
            SELECT series_date, SUM(total) AS total FROM (
                SELECT DATE(COALESCE(published_at, created_at)) AS series_date, COUNT(*) AS total
                FROM social_announcements
                WHERE COALESCE(published_at, created_at) >= ?
                GROUP BY DATE(COALESCE(published_at, created_at))
                UNION ALL
                SELECT DATE(created_at) AS series_date, COUNT(*) AS total
                FROM showdowns
                WHERE created_at >= ?
                GROUP BY DATE(created_at)
                UNION ALL
                SELECT DATE(created_at) AS series_date, COUNT(*) AS total
                FROM polls
                WHERE created_at >= ?
                GROUP BY DATE(created_at)
                UNION ALL
                SELECT DATE(kickoff_at) AS series_date, COUNT(*) AS total
                FROM match_fixtures
                WHERE kickoff_at >= ?
                GROUP BY DATE(kickoff_at)
            ) AS events
            GROUP BY series_date
            ORDER BY series_date
            SQL,
            [$since, $since, $since, $since],
        ))->mapWithKeys(fn ($row) => [$row->series_date => (int) $row->total]);

        return [
            'labels' => $this->dateLabels($days),
            'values' => array_map('intval', $this->fillDateSeries($rows, $days)),
        ];
    }

    /**
     * @return array{labels: array<int, string>, values: array<int, int>}
     */
    public function dailyOtherActivitiesSeries(int $days = 14): array
    {
        $since = now()->subDays($days - 1)->startOfDay()->toDateTimeString();

        $rows = collect(DB::select(
            <<<'SQL'
            SELECT series_date, SUM(total) AS total FROM (
                SELECT DATE(created_at) AS series_date, COUNT(*) AS total
                FROM stage_messages
                WHERE created_at >= ?
                GROUP BY DATE(created_at)
                UNION ALL
                SELECT DATE(created_at) AS series_date, COUNT(*) AS total
                FROM live_stage_comments
                WHERE created_at >= ? AND deleted_at IS NULL
                GROUP BY DATE(created_at)
                UNION ALL
                SELECT DATE(created_at) AS series_date, COUNT(*) AS total
                FROM poll_votes
                WHERE created_at >= ?
                GROUP BY DATE(created_at)
                UNION ALL
                SELECT DATE(created_at) AS series_date, COUNT(*) AS total
                FROM showdown_votes
                WHERE created_at >= ?
                GROUP BY DATE(created_at)
                UNION ALL
                SELECT DATE(created_at) AS series_date, COUNT(*) AS total
                FROM stage_reactions
                WHERE created_at >= ?
                GROUP BY DATE(created_at)
            ) AS activities
            GROUP BY series_date
            ORDER BY series_date
            SQL,
            [$since, $since, $since, $since, $since],
        ))->mapWithKeys(fn ($row) => [$row->series_date => (int) $row->total]);

        return [
            'labels' => $this->dateLabels($days),
            'values' => array_map('intval', $this->fillDateSeries($rows, $days)),
        ];
    }

    /**
     * @return array<string, int>
     */
    public function pointsBySource(int $days = 30): array
    {
        return PointTransaction::query()
            ->selectRaw('source_type, sum(amount) as total_amount')
            ->where('amount', '>', 0)
            ->where('created_at', '>=', now()->subDays($days)->startOfDay())
            ->groupBy('source_type')
            ->orderByDesc('total_amount')
            ->pluck('total_amount', 'source_type')
            ->map(fn ($amount) => (int) $amount)
            ->toArray();
    }

    public function totalPointsDistributed(): int
    {
        return (int) PointTransaction::query()
            ->where('amount', '>', 0)
            ->sum('amount');
    }

    public function pointsFromSource(PointSourceType|string $source): int
    {
        $sourceType = $source instanceof PointSourceType ? $source->value : $source;

        return (int) PointTransaction::query()
            ->where('source_type', $sourceType)
            ->where('amount', '>', 0)
            ->sum('amount');
    }

    /**
     * @return Collection<int, LoyaltyTier>
     */
    public function loyaltyTierDistribution(): Collection
    {
        return LoyaltyTier::query()
            ->withCount('users')
            ->orderBy('display_order')
            ->get();
    }

    /**
     * @return Collection<int, User>
     */
    public function topFans(int $limit = 10): Collection
    {
        return User::query()
            ->with('loyaltyTier')
            ->orderByDesc('total_points')
            ->orderBy('id')
            ->limit($limit)
            ->get();
    }

    public function totalUsers(): int
    {
        return User::count();
    }

    public function newUsersInPeriod(int $days): int
    {
        return User::query()
            ->where('created_at', '>=', now()->subDays($days)->startOfDay())
            ->count();
    }

    public function userGrowthPercent(int $days = 30): float
    {
        $current = $this->newUsersInPeriod($days);
        $previous = User::query()
            ->whereBetween('created_at', [
                now()->subDays($days * 2)->startOfDay(),
                now()->subDays($days)->startOfDay(),
            ])
            ->count();

        if ($previous === 0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    public function pointsAwardedInPeriod(int $days): int
    {
        return (int) PointTransaction::query()
            ->where('amount', '>', 0)
            ->where('created_at', '>=', now()->subDays($days)->startOfDay())
            ->sum('amount');
    }

    public function dailyClaimsToday(): int
    {
        return DailyClaim::query()
            ->whereDate('claim_date', today())
            ->count();
    }

    public function activeReferralsInPeriod(int $days = 30): int
    {
        return Referral::query()
            ->where('created_at', '>=', now()->subDays($days)->startOfDay())
            ->count();
    }

    public function taskCompletionRate(): float
    {
        $totalActiveTasks = Task::query()->where('is_active', true)->count();

        if ($totalActiveTasks === 0) {
            return 0.0;
        }

        $uniqueUsersWithClaims = UserTaskProgress::query()
            ->where('status', 'claimed')
            ->distinct('user_id')
            ->count('user_id');

        $totalUsers = max($this->totalUsers(), 1);

        return round(min(100, ($uniqueUsersWithClaims / $totalUsers) * 100), 1);
    }

    /**
     * @return array<int, int>
     */
    public function userSignupSparkline(int $days = 7): array
    {
        return array_values($this->dailySeries(User::class, 'created_at', $days));
    }

    /**
     * @return array<int, int>
     */
    public function pointsSparkline(int $days = 7): array
    {
        $series = $this->pointsAwardedSeries($days);

        return $series['values'];
    }

    /**
     * @return array<int, int>
     */
    private function adminUserIds(): array
    {
        return User::query()
            ->whereHas('roles', fn ($query) => $query->whereIn('name', User::ADMIN_ROLES))
            ->pluck('id')
            ->all();
    }

    /**
     * @param  Collection<string, mixed>  $rows
     * @return array<int, int|float>
     */
    private function fillDateSeries(Collection $rows, int $days): array
    {
        $series = [];

        for ($i = $days - 1; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $series[] = $rows[$date] ?? 0;
        }

        return $series;
    }

    /**
     * @return array<int, string>
     */
    private function dateLabels(int $days): array
    {
        $labels = [];

        for ($i = $days - 1; $i >= 0; $i--) {
            $labels[] = now()->subDays($i)->format('M d');
        }

        return $labels;
    }

    /**
     * @return array<string, string>
     */
    public function sourceTypeLabels(): array
    {
        return PointSourceType::labels();
    }
}
