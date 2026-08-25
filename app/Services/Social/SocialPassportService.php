<?php

namespace App\Services\Social;

use App\Actions\Social\AwardSocialPoints;
use App\Enums\JerseyOrderStatus;
use App\Enums\MatchTicketStatus;
use App\Models\Follow;
use App\Models\JerseyOrderItem;
use App\Models\LoyaltyTier;
use App\Models\MatchTicket;
use App\Models\Passport;
use App\Models\PointTransaction;
use App\Models\Post;
use App\Models\PostLike;
use App\Models\StreakMilestone;
use App\Models\User;
use App\Models\UserReferralMilestone;
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
     * The fan's trophy case: kits owned, tickets attended, badges earned —
     * everything else the account has actually collected, surfaced as three
     * named lists rather than folded into the loyalty numbers on the card.
     *
     * @return array{jerseys: list<array<string, mixed>>, tickets: list<array<string, mixed>>, badges: list<array<string, mixed>>}
     */
    public function collections(User $viewer): array
    {
        return [
            'jerseys' => $this->jerseyCollection($viewer),
            'tickets' => $this->ticketCollection($viewer),
            'badges' => $this->badgeCollection($viewer),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function jerseyCollection(User $viewer): array
    {
        return JerseyOrderItem::query()
            ->whereHas('order', fn ($query) => $query
                ->where('user_id', $viewer->id)
                ->whereIn('status', [JerseyOrderStatus::Confirmed, JerseyOrderStatus::Fulfilled]))
            ->with(['jersey:id,name,image,club_id', 'jersey.club:id,name,short,logo', 'order:id,status,confirmed_at,fulfilled_at'])
            ->latest('id')
            ->get()
            ->map(fn (JerseyOrderItem $item): array => [
                'id' => $item->id,
                'name' => $item->name ?: $item->jersey?->name,
                'image_url' => $item->jersey?->image_url,
                'size' => $item->size?->value,
                'quantity' => $item->quantity,
                'club_name' => $item->jersey?->club?->name,
                'club_logo_url' => $item->jersey?->club?->logo_url,
                'status' => $item->order?->status?->value,
                'acquired_at' => ($item->order?->fulfilled_at ?? $item->order?->confirmed_at)?->toIso8601String(),
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function ticketCollection(User $viewer): array
    {
        return MatchTicket::query()
            ->where('user_id', $viewer->id)
            ->whereIn('status', [MatchTicketStatus::Paid, MatchTicketStatus::Used])
            ->with(['matchFixture.homeClub:id,name,short,logo', 'matchFixture.awayClub:id,name,short,logo'])
            ->latest('purchased_at')
            ->get()
            ->map(function (MatchTicket $ticket): array {
                $fixture = $ticket->matchFixture;

                return [
                    'id' => $ticket->id,
                    'code' => $ticket->code,
                    'status' => $ticket->status?->value,
                    'section' => $ticket->section,
                    'seat' => $ticket->seat,
                    'purchased_at' => $ticket->purchased_at?->toIso8601String(),
                    'fixture' => $fixture ? [
                        'home' => $fixture->homeClub?->name,
                        'home_logo_url' => $fixture->homeClub?->logo_url,
                        'away' => $fixture->awayClub?->name,
                        'away_logo_url' => $fixture->awayClub?->logo_url,
                        'kickoff_at' => $fixture->kickoff_at?->toIso8601String(),
                        'venue' => $fixture->venue,
                    ] : null,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Two badge families, one list: streak milestones (a threshold against the
     * account's own best streak — there's no per-user completion row for
     * these, so "earned" just means the best streak ever reached it) and
     * referral milestones (which do have a completion record and date).
     *
     * @return list<array<string, mixed>>
     */
    private function badgeCollection(User $viewer): array
    {
        $streakBadges = StreakMilestone::query()
            ->where('day_count', '<=', (int) $viewer->best_streak_days)
            ->orderByDesc('day_count')
            ->get()
            ->map(fn (StreakMilestone $milestone): array => [
                'id' => 'streak-'.$milestone->id,
                'type' => 'streak',
                'name' => $milestone->name ?: $milestone->day_count.'-day streak',
                'description' => $milestone->description,
                'bonus_points' => (int) $milestone->bonus_points,
                'achieved_at' => null,
            ]);

        $referralBadges = UserReferralMilestone::query()
            ->where('user_id', $viewer->id)
            ->whereNotNull('completed_at')
            ->with('referralMilestone')
            ->orderByDesc('completed_at')
            ->get()
            ->map(fn (UserReferralMilestone $progress): array => [
                'id' => 'referral-'.$progress->id,
                'type' => 'referral',
                'name' => $progress->referralMilestone?->reward_name ?: $progress->referralMilestone?->target_count.' referrals',
                'description' => $progress->referralMilestone?->reward_description,
                'bonus_points' => (int) ($progress->referralMilestone?->bonus_points ?? 0),
                'achieved_at' => $progress->completed_at?->toIso8601String(),
            ]);

        return $streakBadges->concat($referralBadges)->values()->all();
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
