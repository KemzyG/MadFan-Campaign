<?php

namespace App\Services\Social;

use App\Actions\Social\AwardSocialPoints;
use App\Enums\PointSourceType;
use App\Enums\StageParticipantRole;
use App\Models\LoyaltyTier;
use App\Models\Post;
use App\Models\PointTransaction;
use App\Models\User;

/**
 * Assembles the Mad Fan Social wallet: the fan's points balance, their
 * composite {@see LoyaltyScoreService} score, a categorised breakdown of where
 * points came from (posting, replies, likes, chat, campaign), headline
 * activity stats (including live-stage engagement), and a recent ledger feed.
 *
 * Read-only aggregation over the append-only point_transactions ledger plus a
 * handful of counts; no writes, no snapshot side effects.
 */
class WalletService
{
    /**
     * Ledger source_type -> wallet breakdown category. String constants (not
     * enum ->value fetches) so the map is a portable constant expression.
     */
    private const CATEGORY_MAP = [
        AwardSocialPoints::SOURCE_POST => 'posting',
        AwardSocialPoints::SOURCE_REPLY => 'replies',
        AwardSocialPoints::SOURCE_LIKE_RECEIVED => 'likes',
        AwardSocialPoints::SOURCE_CHAT => 'chat',
        'social_matchday_bonus' => 'matchday',
    ];

    private const CATEGORY_LABELS = [
        'posting' => 'Posting',
        'replies' => 'Replies',
        'likes' => 'Likes received',
        'chat' => 'Club chat',
        'matchday' => 'Matchday bonus',
        'campaign' => 'Campaign & app',
    ];

    public function __construct(
        private LoyaltyScoreService $loyaltyScores,
        private SocialPassportService $passport,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function present(User $viewer): array
    {
        $viewer->loadMissing(['loyaltyTier', 'favouriteClub']);
        $points = (int) $viewer->total_points;

        $tier = LoyaltyTier::forPoints($points) ?? $viewer->loyaltyTier;
        $nextTier = $tier?->nextTier();

        $sourceTotals = $this->pointsBySource($viewer);
        $totalEarned = (int) array_sum(array_column($sourceTotals, 'total'));

        return [
            'balance' => [
                'total_points' => $points,
                'total_earned' => $totalEarned,
                'currency_label' => 'Fan points',
                'tier' => $tier ? [
                    'code' => $tier->code,
                    'name' => $tier->name,
                    'min_points' => (int) $tier->min_points,
                ] : null,
                'next_tier' => $nextTier ? [
                    'name' => $nextTier->name,
                    'min_points' => (int) $nextTier->min_points,
                    'points_needed' => max(0, (int) $nextTier->min_points - $points),
                    'progress_percent' => $this->tierProgressPercent($points, $tier, $nextTier),
                ] : null,
            ],
            'loyalty' => $this->loyaltyScores->scoreFor($viewer),
            'breakdown' => $this->breakdown($sourceTotals, $totalEarned),
            'stats' => $this->stats($viewer, $sourceTotals),
            'activity' => $this->passport->recentActivity($viewer, 12),
        ];
    }

    /**
     * Earned points grouped by ledger source (positive amounts only).
     *
     * @return array<string, array{count: int, total: int}>
     */
    private function pointsBySource(User $user): array
    {
        return PointTransaction::query()
            ->where('user_id', $user->id)
            ->where('amount', '>', 0)
            ->selectRaw('source_type, COUNT(*) as count, SUM(amount) as total')
            ->groupBy('source_type')
            ->get()
            ->mapWithKeys(fn ($row) => [
                (string) $row->source_type => [
                    'count' => (int) $row->count,
                    'total' => (int) $row->total,
                ],
            ])
            ->all();
    }

    /**
     * Roll the per-source totals up into wallet categories, largest first.
     *
     * @param  array<string, array{count: int, total: int}>  $sourceTotals
     * @return list<array{key: string, label: string, points: int, count: int, percent: int}>
     */
    private function breakdown(array $sourceTotals, int $totalEarned): array
    {
        $categories = [];

        foreach ($sourceTotals as $source => $data) {
            $key = self::CATEGORY_MAP[$source] ?? 'campaign';
            $categories[$key]['points'] = ($categories[$key]['points'] ?? 0) + $data['total'];
            $categories[$key]['count'] = ($categories[$key]['count'] ?? 0) + $data['count'];
        }

        $rows = [];
        foreach ($categories as $key => $data) {
            $rows[] = [
                'key' => $key,
                'label' => self::CATEGORY_LABELS[$key] ?? ucfirst($key),
                'points' => $data['points'],
                'count' => $data['count'],
                'percent' => $totalEarned > 0 ? (int) round(($data['points'] / $totalEarned) * 100) : 0,
            ];
        }

        usort($rows, fn ($a, $b) => $b['points'] <=> $a['points']);

        return $rows;
    }

    /**
     * Headline activity stats surfaced as wallet tiles.
     *
     * @param  array<string, array{count: int, total: int}>  $sourceTotals
     * @return array<string, int>
     */
    private function stats(User $viewer, array $sourceTotals): array
    {
        $postingPoints = $sourceTotals[PointSourceType::SocialPost->value]['total'] ?? 0;
        $chatPoints = $sourceTotals[PointSourceType::SocialChat->value]['total'] ?? 0;

        $postsPublished = Post::query()
            ->where('author_id', $viewer->id)
            ->whereNull('reply_to_id')
            ->count();

        $repliesPosted = Post::query()
            ->where('author_id', $viewer->id)
            ->whereNotNull('reply_to_id')
            ->count();

        $likesReceived = (int) Post::query()
            ->where('author_id', $viewer->id)
            ->sum('likes_count');

        $stagesJoined = $viewer->stageParticipations()->count();
        $stagesHosted = $viewer->hostedStages()->count();
        $timesOnMic = $viewer->stageParticipations()
            ->whereIn('role', [StageParticipantRole::Speaker->value, StageParticipantRole::Host->value])
            ->count();

        return [
            'posting_points' => $postingPoints,
            'chat_points' => $chatPoints,
            'posts_published' => $postsPublished,
            'replies_posted' => $repliesPosted,
            'likes_received' => $likesReceived,
            'stage_engagements' => $stagesJoined + $stagesHosted,
            'stages_joined' => $stagesJoined,
            'stages_hosted' => $stagesHosted,
            'times_on_mic' => $timesOnMic,
            'streak_days' => (int) $viewer->current_streak_days,
            'best_streak_days' => (int) $viewer->best_streak_days,
            'referrals' => (int) $viewer->referral_count,
        ];
    }

    private function tierProgressPercent(int $points, ?LoyaltyTier $tier, LoyaltyTier $nextTier): int
    {
        $floor = (int) ($tier?->min_points ?? 0);
        $ceiling = (int) $nextTier->min_points;

        if ($ceiling <= $floor) {
            return 100;
        }

        $progress = ($points - $floor) / ($ceiling - $floor);

        return max(0, min(100, (int) round($progress * 100)));
    }
}
