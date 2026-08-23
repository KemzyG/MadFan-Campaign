<?php

namespace App\Services\Social;

use App\Models\LeagueStanding;
use App\Models\User;

/**
 * Composite fan loyalty score (0â€“1000).
 *
 * The score blends three normalised (0â€“1) components, matching the product
 * definition "user performance + club performance + global performance":
 *
 *   â€¢ user   â€” the fan's own dedication/consistency (login streak).
 *   â€¢ club   â€” how the fan's favourite club is performing in its league table.
 *   â€¢ global â€” where the fan sits among all other fans by total points.
 *
 * Weights are tunable constants. When a component is unavailable (e.g. the fan
 * has no favourite club, or their league has no standings yet) its weight is
 * dropped and the remaining weights are renormalised so the score is never
 * unfairly capped.
 *
 * The pure component/composite helpers carry no queries so the leaderboard can
 * score 30 fans from a single batch of context without N+1. {@see scoreFor()}
 * is the query-backed convenience for a single fan (used by the wallet).
 */
class LoyaltyScoreService
{
    public const MAX_SCORE = 1000;

    /** Relative importance of each component; need not sum to 1 (renormalised). */
    public const WEIGHT_USER = 0.40;

    public const WEIGHT_CLUB = 0.25;

    public const WEIGHT_GLOBAL = 0.35;

    /** Current streak (days) that saturates the streak half of the user component. */
    public const STREAK_TARGET_DAYS = 30;

    /** Best-ever streak (days) that saturates the loyalty half of the user component. */
    public const BEST_STREAK_TARGET_DAYS = 90;

    /**
     * Full, query-backed score for a single fan. Used by the wallet surface.
     *
     * @return array{
     *     score: int,
     *     max: int,
     *     grade: string,
     *     percentile: int,
     *     components: array<string, array{key: string, label: string, value: int, weight: int, available: bool}>
     * }
     */
    public function scoreFor(User $user): array
    {
        $user->loadMissing('favouriteClub');

        $totalFans = User::query()->fanAccounts()->count();
        $fansBelow = User::query()
            ->fanAccounts()
            ->where('total_points', '<', (int) $user->total_points)
            ->count();

        $global = $this->globalComponentFromPoints($fansBelow, $totalFans);
        $club = $this->clubComponentForUser($user);
        $userComponent = $this->userComponent(
            (int) $user->current_streak_days,
            (int) $user->best_streak_days,
        );

        return $this->composite($userComponent, $club, $global);
    }

    /**
     * The fan's own dedication, from streak history alone (no queries).
     */
    public function userComponent(int $currentStreakDays, int $bestStreakDays): float
    {
        $current = $this->ratio($currentStreakDays, self::STREAK_TARGET_DAYS);
        $best = $this->ratio($bestStreakDays, self::BEST_STREAK_TARGET_DAYS);

        return $this->clamp(0.65 * $current + 0.35 * $best);
    }

    /**
     * League standing of a club, normalised so 1st place = 1.0 and last â‰ˆ 0.
     */
    public function clubComponentFromPosition(int $position, int $leagueSize): ?float
    {
        if ($leagueSize <= 1 || $position < 1) {
            return null;
        }

        return $this->clamp(($leagueSize - $position) / ($leagueSize - 1));
    }

    /**
     * Percentile of a fan among all fans by total points (0 = bottom, 1 = top).
     */
    public function globalComponentFromPoints(int $fansBelow, int $totalFans): float
    {
        if ($totalFans <= 1) {
            return 1.0;
        }

        return $this->clamp($fansBelow / ($totalFans - 1));
    }

    /**
     * Percentile derived from an absolute leaderboard rank (1 = best).
     */
    public function globalComponentFromRank(int $rank, int $totalFans): float
    {
        if ($totalFans <= 1) {
            return 1.0;
        }

        return $this->clamp(($totalFans - $rank) / ($totalFans - 1));
    }

    /**
     * Combine the three components into a score payload, renormalising the
     * weights of whichever components are present.
     *
     * @return array{
     *     score: int,
     *     max: int,
     *     grade: string,
     *     percentile: int,
     *     components: array<string, array{key: string, label: string, value: int, weight: int, available: bool}>
     * }
     */
    public function composite(float $userComponent, ?float $clubComponent, float $globalComponent): array
    {
        $parts = [
            'user' => ['label' => 'Your activity', 'value' => $this->clamp($userComponent), 'weight' => self::WEIGHT_USER],
            'club' => ['label' => 'Club form', 'value' => $clubComponent, 'weight' => self::WEIGHT_CLUB],
            'global' => ['label' => 'Global standing', 'value' => $this->clamp($globalComponent), 'weight' => self::WEIGHT_GLOBAL],
        ];

        $activeWeight = 0.0;
        foreach ($parts as $part) {
            if ($part['value'] !== null) {
                $activeWeight += $part['weight'];
            }
        }

        $combined = 0.0;
        if ($activeWeight > 0) {
            foreach ($parts as $part) {
                if ($part['value'] !== null) {
                    $combined += ($part['weight'] / $activeWeight) * $part['value'];
                }
            }
        }

        $score = (int) round(self::MAX_SCORE * $combined);

        $components = [];
        foreach ($parts as $key => $part) {
            $components[$key] = [
                'key' => $key,
                'label' => $part['label'],
                'value' => $part['value'] === null ? 0 : (int) round(100 * $part['value']),
                'weight' => (int) round(100 * $part['weight']),
                'available' => $part['value'] !== null,
            ];
        }

        return [
            'score' => $score,
            'max' => self::MAX_SCORE,
            'grade' => $this->grade($score),
            'percentile' => (int) round(100 * $this->clamp($globalComponent)),
            'components' => $components,
        ];
    }

    /**
     * Query the favourite club's league position and normalise it.
     */
    private function clubComponentForUser(User $user): ?float
    {
        $club = $user->favouriteClub;

        if ($club === null || $club->league_id === null) {
            return null;
        }

        $standing = LeagueStanding::query()
            ->where('league_id', $club->league_id)
            ->where('club_id', $club->id)
            ->first(['points']);

        if ($standing === null) {
            return null;
        }

        $leagueSize = LeagueStanding::query()->where('league_id', $club->league_id)->count();
        $position = LeagueStanding::query()
            ->where('league_id', $club->league_id)
            ->where('points', '>', (int) $standing->points)
            ->count() + 1;

        return $this->clubComponentFromPosition($position, $leagueSize);
    }

    /**
     * Letter grade band for a score (S is elite, E is entry level).
     */
    private function grade(int $score): string
    {
        return match (true) {
            $score >= 900 => 'S',
            $score >= 750 => 'A',
            $score >= 600 => 'B',
            $score >= 450 => 'C',
            $score >= 300 => 'D',
            default => 'E',
        };
    }

    private function ratio(int $value, int $target): float
    {
        if ($target <= 0) {
            return 0.0;
        }

        return $value / $target;
    }

    private function clamp(float $value): float
    {
        return max(0.0, min(1.0, $value));
    }
}
