<?php

namespace App\Services\Social;

use App\Actions\Social\AwardSocialPoints;
use App\Models\Follow;
use App\Models\LoyaltyTier;
use App\Models\Passport;
use App\Models\PointTransaction;
use App\Models\Post;
use App\Models\PostLike;
use App\Models\User;
use App\Services\SeasonService;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class SocialPassportService
{
    public function __construct(
        private SeasonService $seasonService,
    ) {}

    /**
     * Keep passport snapshots aligned with live user loyalty identity.
     */
    public function syncSnapshot(User $user): Passport
    {
        $user->loadMissing(['loyaltyTier', 'favouriteClub']);
        $season = $this->seasonService->activeSeason();
        $tier = LoyaltyTier::forPoints((int) $user->total_points) ?? $user->loyaltyTier;

        $passport = Passport::query()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'season_id' => $season->id,
                'qr_value' => 'MF:'.$user->fan_id,
                'referral_link' => url('/r/'.$user->fan_id),
                'share_slug' => Str::slug(($user->username ?: $user->fan_id).'-'.Str::random(6)),
                'is_public' => false,
            ],
        );

        $passport->fill([
            'season_id' => $season->id,
            'snapshot_name' => $user->name,
            'snapshot_handle' => $user->handle ?: $user->username,
            'snapshot_club' => $user->favouriteClub?->name ?? $user->club,
            'snapshot_tier' => $tier?->name,
            'snapshot_points' => (int) $user->total_points,
            'snapshot_streak_days' => (int) $user->current_streak_days,
            'snapshot_referral_count' => (int) $user->referral_count,
        ])->save();

        return $passport->fresh(['season']);
    }

    /**
     * Identity + loyalty payload for Mad Fan Social passport surface.
     *
     * @return array<string, mixed>
     */
    public function present(User $viewer): array
    {
        $viewer->loadMissing(['favouriteClub.league', 'loyaltyTier']);
        $passport = $this->syncSnapshot($viewer);
        $season = $passport->season ?? $this->seasonService->activeSeason();
        $points = (int) $viewer->total_points;
        $tier = LoyaltyTier::forPoints($points) ?? $viewer->loyaltyTier;
        $nextTier = $tier?->nextTier();

        $socialSources = [
            AwardSocialPoints::SOURCE_POST,
            AwardSocialPoints::SOURCE_REPLY,
            AwardSocialPoints::SOURCE_LIKE_RECEIVED,
            AwardSocialPoints::SOURCE_CHAT,
            'social_matchday_bonus',
        ];

        $socialPointsEarned = (int) PointTransaction::query()
            ->where('user_id', $viewer->id)
            ->whereIn('source_type', $socialSources)
            ->sum('amount');

        $postsCount = Post::query()
            ->where('author_id', $viewer->id)
            ->whereNull('reply_to_id')
            ->count();

        $repliesCount = Post::query()
            ->where('author_id', $viewer->id)
            ->whereNotNull('reply_to_id')
            ->count();

        $likesReceived = (int) Post::query()
            ->where('author_id', $viewer->id)
            ->sum('likes_count');

        $likesGiven = PostLike::query()->where('user_id', $viewer->id)->count();
        $followers = Follow::query()->where('following_id', $viewer->id)->count();
        $following = Follow::query()->where('follower_id', $viewer->id)->count();
        $referrals = (int) $viewer->referral_count;
        $clubName = $viewer->favouriteClub?->name ?? $viewer->club;

        return [
            'brand' => [
                'name' => config('app.name'),
                'logo_url' => is_file(public_path('favicon.jpg'))
                    ? asset('favicon.jpg')
                    : null,
            ],
            'identity' => [
                'name' => $viewer->name,
                'handle' => $viewer->handle ?: $viewer->username ?: $viewer->fan_id,
                'fan_id' => $viewer->fan_id,
                'member_no' => $viewer->fan_id,
                'bio' => $viewer->bio,
                'country' => $viewer->country,
                'avatar_url' => $viewer->avatar_url ?? null,
                'joined_at' => $viewer->created_at?->toIso8601String(),
                'social_onboarded_at' => $viewer->social_onboarded_at?->toIso8601String(),
                'club' => $viewer->favouriteClub ? [
                    'id' => $viewer->favouriteClub->id,
                    'name' => $viewer->favouriteClub->name,
                    'short' => $viewer->favouriteClub->short,
                    'logo_url' => $viewer->favouriteClub->logo_url,
                    'league' => $viewer->favouriteClub->league?->name,
                ] : [
                    'id' => null,
                    'name' => $viewer->club,
                    'short' => null,
                    'logo_url' => null,
                    'league' => $viewer->league,
                ],
            ],
            'season' => [
                'id' => $season->id,
                'code' => $season->code,
                'name' => $season->name,
                'label' => $season->name ?: $season->code,
            ],
            'loyalty' => [
                'points' => $points,
                'social_points_earned' => $socialPointsEarned,
                'campaign_points' => max(0, $points - $socialPointsEarned),
                'streak_days' => (int) $viewer->current_streak_days,
                'best_streak_days' => (int) $viewer->best_streak_days,
                'tier' => $tier ? [
                    'id' => $tier->id,
                    'code' => $tier->code,
                    'name' => $tier->name,
                    'min_points' => (int) $tier->min_points,
                ] : null,
                'next_tier' => $nextTier ? [
                    'name' => $nextTier->name,
                    'min_points' => (int) $nextTier->min_points,
                    'points_needed' => max(0, (int) $nextTier->min_points - $points),
                ] : null,
                'earn_rules' => collect(AwardSocialPoints::RULES)
                    ->map(fn (array $rule, string $source) => [
                        'source' => $source,
                        'points' => $rule['points'],
                        'cap' => $rule['cap'],
                        'min_chars' => $rule['min_chars'] ?? null,
                        'label' => match ($source) {
                            AwardSocialPoints::SOURCE_POST => 'Publish a post',
                            AwardSocialPoints::SOURCE_REPLY => 'Meaningful reply',
                            AwardSocialPoints::SOURCE_LIKE_RECEIVED => 'Like received',
                            default => $source,
                        },
                    ])
                    ->values()
                    ->all(),
            ],
            'records' => [
                'posts' => $postsCount,
                'replies' => $repliesCount,
                'likes_received' => $likesReceived,
                'likes_given' => $likesGiven,
                'followers' => $followers,
                'following' => $following,
                'referrals' => $referrals,
                'engagements' => $postsCount + $repliesCount + $likesGiven,
            ],
            'club_contribution' => [
                'club_name' => $clubName,
                'social_points' => $socialPointsEarned,
                'total_points' => $points,
                'share_percent' => $points > 0
                    ? (int) round(($socialPointsEarned / $points) * 100)
                    : 0,
                'posts' => $postsCount,
                'replies' => $repliesCount,
            ],
            'activity' => $this->recentActivity($viewer, 4),
            'passport' => [
                'id' => $passport->id,
                'qr_value' => $passport->qr_value,
                'season_id' => $passport->season_id,
                'campaign_url' => route('fan.passport'),
                'referral_link' => $passport->referral_link,
                'qr_payload' => $passport->referral_link ?: url('/r/'.$viewer->fan_id),
                'snapshot_points' => (int) $passport->snapshot_points,
                'issued_at' => $passport->created_at?->toIso8601String(),
                'updated_at' => $passport->updated_at?->toIso8601String(),
            ],
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function recentActivity(User $user, int $limit = 25): array
    {
        /** @var Collection<int, PointTransaction> $rows */
        $rows = PointTransaction::query()
            ->where('user_id', $user->id)
            ->latest('id')
            ->limit($limit)
            ->get(['id', 'source_type', 'amount', 'reason', 'balance_after', 'created_at']);

        return $rows->map(fn (PointTransaction $tx) => [
            'id' => $tx->id,
            'source_type' => $tx->source_type,
            'amount' => (int) $tx->amount,
            'reason' => $tx->reason,
            'balance_after' => (int) $tx->balance_after,
            'created_at' => $tx->created_at?->toIso8601String(),
            'is_social' => str_starts_with((string) $tx->source_type, 'social_'),
        ])->values()->all();
    }
}
