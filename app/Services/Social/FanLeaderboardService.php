<?php

namespace App\Services\Social;

use App\Models\Club;
use App\Models\LeagueStanding;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Builds the Mad Fan Social fan leaderboard: the top fans ranked by lifetime
 * points, each carrying a composite {@see LoyaltyScoreService} score, plus the
 * viewer's own standing when they fall outside the visible board.
 *
 * Loyalty scores for the whole board are computed from a single batch of
 * context (rank + one standings query per distinct league) rather than a
 * per-fan query, so rendering 30 fans stays flat.
 */
class FanLeaderboardService
{
    public const DEFAULT_LIMIT = 30;

    public function __construct(
        private LoyaltyScoreService $loyaltyScores,
    ) {}

    /**
     * @return array{
     *     entries: list<array<string, mixed>>,
     *     current_user: array<string, mixed>|null,
     *     total_fans: int,
     *     limit: int
     * }
     */
    public function present(
        ?User $viewer,
        int $limit = self::DEFAULT_LIMIT,
        ?int $fandomId = null,
        ?int $clubId = null,
        ?int $leagueId = null,
    ): array {
        $limit = max(1, min($limit, 100));

        $scope = fn () => User::query()
            ->fanAccounts()
            ->when($fandomId !== null, fn ($query) => $query->where('favourite_fandom_id', $fandomId))
            ->when($clubId !== null, fn ($query) => $query->where('favourite_club_id', $clubId))
            ->when($leagueId !== null, fn ($query) => $query->whereHas(
                'favouriteClub',
                fn ($clubQuery) => $clubQuery->where('league_id', $leagueId),
            ));

        $totalFans = $scope()->count();

        /** @var Collection<int, User> $top */
        $top = $scope()
            ->with('favouriteClub')
            ->orderByDesc('total_points')
            ->orderBy('id')
            ->limit($limit)
            ->get();

        $clubPositions = $this->clubPositionMap($top->pluck('favouriteClub')->filter());

        $viewerId = $viewer?->id;
        $entries = $top->values()->map(function (User $fan, int $index) use ($totalFans, $clubPositions, $viewerId) {
            return $this->entry($fan, $index + 1, $totalFans, $clubPositions, $viewerId);
        })->all();

        $currentUser = null;
        if ($viewer !== null) {
            $inBoard = $top->firstWhere('id', $viewer->id);
            $currentUser = $inBoard
                ? $this->findEntry($entries, $viewer->id)
                : $this->viewerEntry($viewer, $totalFans, $fandomId, $clubId, $leagueId);
        }

        return [
            'entries' => $entries,
            'current_user' => $currentUser,
            'total_fans' => $totalFans,
            'limit' => $limit,
        ];
    }

    /**
     * Shape one ranked fan for the board.
     *
     * @param  array<int, int>  $clubPositions  club_id => normalised position weight source
     * @return array<string, mixed>
     */
    private function entry(User $fan, int $rank, int $totalFans, array $clubPositions, ?int $viewerId): array
    {
        $global = $this->loyaltyScores->globalComponentFromRank($rank, $totalFans);
        $userComponent = $this->loyaltyScores->userComponent(
            (int) $fan->current_streak_days,
            (int) $fan->best_streak_days,
        );
        $club = $clubPositions[$fan->favourite_club_id] ?? null;
        $score = $this->loyaltyScores->composite($userComponent, $club, $global);

        return [
            'rank' => $rank,
            'points' => (int) $fan->total_points,
            'loyalty' => $score,
            'is_you' => $viewerId !== null && $fan->id === $viewerId,
            'fan' => $this->publicIdentity($fan),
        ];
    }

    /**
     * Viewer standing when they are outside the visible board. Rank and
     * loyalty score are computed against the same scoped population as the
     * board itself, so a fan's score reads consistently whether they're on
     * or off the visible list.
     *
     * @return array<string, mixed>
     */
    private function viewerEntry(User $viewer, int $totalFans, ?int $fandomId, ?int $clubId, ?int $leagueId = null): array
    {
        $ahead = User::query()
            ->fanAccounts()
            ->when($fandomId !== null, fn ($query) => $query->where('favourite_fandom_id', $fandomId))
            ->when($clubId !== null, fn ($query) => $query->where('favourite_club_id', $clubId))
            ->when($leagueId !== null, fn ($query) => $query->whereHas(
                'favouriteClub',
                fn ($clubQuery) => $clubQuery->where('league_id', $leagueId),
            ))
            ->where(function ($query) use ($viewer): void {
                $query->where('total_points', '>', $viewer->total_points)
                    ->orWhere(function ($query) use ($viewer): void {
                        $query->where('total_points', $viewer->total_points)
                            ->where('id', '<', $viewer->id);
                    });
            })
            ->count();

        $rank = $ahead + 1;
        $viewer->loadMissing('favouriteClub');
        $club = $viewer->favouriteClub
            ? $this->clubPositionMap(collect([$viewer->favouriteClub]))[$viewer->favouriteClub->id] ?? null
            : null;

        $userComponent = $this->loyaltyScores->userComponent(
            (int) $viewer->current_streak_days,
            (int) $viewer->best_streak_days,
        );
        $global = $this->loyaltyScores->globalComponentFromRank($rank, $totalFans);

        return [
            'rank' => $rank,
            'points' => (int) $viewer->total_points,
            'loyalty' => $this->loyaltyScores->composite($userComponent, $club, $global),
            'is_you' => true,
            'fan' => $this->publicIdentity($viewer),
        ];
    }

    /**
     * Public social identity (no email/real-name leakage on a shared board).
     *
     * @return array<string, mixed>
     */
    private function publicIdentity(User $fan): array
    {
        $club = $fan->favouriteClub;

        return [
            'id' => $fan->id,
            'handle' => $fan->handle ?: $fan->username ?: $fan->fan_id,
            'avatar_url' => $fan->avatar_url,
            'avatar_emoji' => $fan->avatar_emoji,
            'streak_days' => (int) $fan->current_streak_days,
            'club' => $club ? [
                'name' => $club->name,
                'short' => $club->short,
                'logo_url' => $club->logo_url,
            ] : ($fan->club ? ['name' => $fan->club, 'short' => null, 'logo_url' => null] : null),
        ];
    }

    /**
     * Build a club_id => normalised-position map from one standings query per
     * distinct league, so the board never issues a query per fan.
     *
     * @param  Collection<int, Club>  $clubs
     * @return array<int, float>
     */
    private function clubPositionMap(Collection $clubs): array
    {
        $leagueIds = $clubs
            ->pluck('league_id')
            ->filter()
            ->unique()
            ->values();

        if ($leagueIds->isEmpty()) {
            return [];
        }

        $standings = LeagueStanding::query()
            ->whereIn('league_id', $leagueIds)
            ->orderBy('league_id')
            ->orderByDesc('points')
            ->get(['league_id', 'club_id', 'points']);

        $byLeague = $standings->groupBy('league_id');
        $map = [];

        foreach ($byLeague as $rows) {
            $size = $rows->count();
            foreach ($rows->values() as $index => $row) {
                // Standings are already ordered by points desc, so index+1 is the position.
                $weight = $this->loyaltyScores->clubComponentFromPosition($index + 1, $size);
                if ($weight !== null) {
                    $map[(int) $row->club_id] = $weight;
                }
            }
        }

        return $map;
    }

    /**
     * @param  list<array<string, mixed>>  $entries
     * @return array<string, mixed>|null
     */
    private function findEntry(array $entries, int $userId): ?array
    {
        foreach ($entries as $entry) {
            if (($entry['fan']['id'] ?? null) === $userId) {
                return $entry;
            }
        }

        return null;
    }
}
