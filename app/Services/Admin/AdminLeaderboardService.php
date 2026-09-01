<?php

namespace App\Services\Admin;

use App\Models\Club;
use App\Models\Fandom;
use App\Models\League;
use App\Models\PointTransaction;
use App\Models\Season;
use App\Models\User;
use App\Services\Social\FanLeaderboardService;
use App\Services\Social\LoyaltyScoreService;

class AdminLeaderboardService
{
    public function __construct(
        private FanLeaderboardService $leaderboard,
        private LoyaltyScoreService $loyaltyScores,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function pageData(
        string $scope = 'global',
        ?int $fandomId = null,
        ?int $clubId = null,
        ?int $leagueId = null,
        ?int $seasonId = null,
        int $limit = 50,
    ): array {
        if ($seasonId) {
            $season = Season::query()->find($seasonId, ['id', 'name']);

            return $this->wrapPageData(
                scope: 'season',
                board: $this->enrichEntries($this->seasonBoard($seasonId, $limit)),
                filters: [
                    'scope' => 'season',
                    'season_id' => $season?->id,
                    'limit' => $limit,
                ],
                season: $season ? ['id' => $season->id, 'name' => $season->name] : null,
            );
        }

        $scope = in_array($scope, ['fandom', 'club', 'league'], true) ? $scope : 'global';

        $fandom = null;
        $club = null;
        $league = null;

        if ($scope === 'fandom' && $fandomId) {
            $fandom = Fandom::query()->find($fandomId, ['id', 'name', 'slug']);
            $scope = $fandom ? 'fandom' : 'global';
        }

        if ($scope === 'club' && $clubId) {
            $club = Club::query()->with('league:id,name')->find($clubId);
            $scope = $club ? 'club' : 'global';
        }

        if ($scope === 'league' && $leagueId) {
            $league = League::query()->with('fandom:id,name')->find($leagueId, ['id', 'name', 'fandom_id']);
            $scope = $league ? 'league' : 'global';
        }

        $board = $this->leaderboard->present(
            null,
            $limit,
            $fandom?->id,
            $club?->id,
            $league?->id,
        );

        return $this->wrapPageData(
            scope: $scope,
            board: $this->enrichEntries($board),
            filters: [
                'scope' => $scope,
                'fandom_id' => $fandom?->id,
                'club_id' => $club?->id,
                'league_id' => $league?->id,
                'limit' => $limit,
            ],
            fandom: $fandom,
            club: $club,
            league: $league,
        );
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function exportRows(
        string $scope = 'global',
        ?int $fandomId = null,
        ?int $clubId = null,
        ?int $leagueId = null,
        ?int $seasonId = null,
        int $limit = 500,
    ): array {
        $page = $this->pageData($scope, $fandomId, $clubId, $leagueId, $seasonId, $limit);

        return collect($page['board']['entries'] ?? [])->map(function (array $entry): array {
            $admin = $entry['admin'] ?? [];
            $fan = $entry['fan'] ?? [];

            return [
                'rank' => $entry['rank'] ?? '',
                'name' => $admin['name'] ?? $fan['handle'] ?? '',
                'email' => $admin['email'] ?? '',
                'fan_id' => $admin['fan_id'] ?? $fan['handle'] ?? '',
                'fandom' => $admin['fandom'] ?? '',
                'club' => $admin['club'] ?? ($fan['club']['name'] ?? ''),
                'points' => $entry['points'] ?? 0,
                'loyalty' => $entry['loyalty'] ?? 0,
                'streak' => $fan['streak_days'] ?? 0,
            ];
        })->values()->all();
    }

    /**
     * @return array{entries: list<array<string, mixed>>, total_fans: int, limit: int, current_user: null}
     */
    private function seasonBoard(int $seasonId, int $limit): array
    {
        $limit = max(1, min($limit, 1000));

        $totals = PointTransaction::query()
            ->selectRaw('user_id, SUM(amount) as season_points')
            ->where('season_id', $seasonId)
            ->where('amount', '>', 0)
            ->groupBy('user_id')
            ->orderByDesc('season_points')
            ->limit($limit)
            ->get();

        $totalFans = PointTransaction::query()
            ->where('season_id', $seasonId)
            ->where('amount', '>', 0)
            ->distinct('user_id')
            ->count('user_id');

        $fanIds = $totals->pluck('user_id')->all();

        /** @var array<int, User> $fans */
        $fans = User::query()
            ->fanAccounts()
            ->with('favouriteClub')
            ->whereIn('id', $fanIds)
            ->get()
            ->keyBy('id')
            ->all();

        $entries = [];
        foreach ($totals->values() as $index => $row) {
            $fan = $fans[$row->user_id] ?? null;
            if ($fan === null) {
                continue;
            }

            $rank = $index + 1;
            $global = $this->loyaltyScores->globalComponentFromRank($rank, max(1, $totalFans));
            $userComponent = $this->loyaltyScores->userComponent(
                (int) $fan->current_streak_days,
                (int) $fan->best_streak_days,
            );
            $score = $this->loyaltyScores->composite($userComponent, null, $global);

            $entries[] = [
                'rank' => $rank,
                'points' => (int) $row->season_points,
                'loyalty' => $score,
                'is_you' => false,
                'fan' => [
                    'id' => $fan->id,
                    'handle' => $fan->handle ?: $fan->username ?: $fan->fan_id,
                    'streak_days' => (int) $fan->current_streak_days,
                    'club' => $fan->favouriteClub ? ['name' => $fan->favouriteClub->name] : null,
                ],
            ];
        }

        return [
            'entries' => $entries,
            'total_fans' => $totalFans,
            'limit' => $limit,
            'current_user' => null,
        ];
    }

    /**
     * @param  array{entries: list<array<string, mixed>>, total_fans: int, limit: int, current_user?: mixed}  $board
     * @return array{entries: list<array<string, mixed>>, total_fans: int, limit: int, current_user?: mixed}
     */
    private function enrichEntries(array $board): array
    {
        $fanIds = collect($board['entries'])
            ->pluck('fan.id')
            ->filter()
            ->values()
            ->all();

        /** @var array<int, User> $users */
        $users = User::query()
            ->with(['favouriteFandom:id,name', 'favouriteClub:id,name,short,league_id'])
            ->whereIn('id', $fanIds)
            ->get()
            ->keyBy('id')
            ->all();

        $entries = collect($board['entries'])->map(function (array $entry) use ($users): array {
            $fanId = $entry['fan']['id'] ?? null;
            /** @var User|null $user */
            $user = $fanId ? ($users[$fanId] ?? null) : null;

            return [
                ...$entry,
                'admin' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'username' => $user->username,
                    'fan_id' => $user->fan_id,
                    'fandom' => $user->favouriteFandom?->name,
                    'club' => $user->favouriteClub?->name ?? $user->club,
                ] : null,
            ];
        })->values()->all();

        return [
            ...$board,
            'entries' => $entries,
        ];
    }

    /**
     * @param  array{entries: list<array<string, mixed>>, total_fans: int, limit: int, current_user?: mixed}  $board
     * @return array<string, mixed>
     */
    private function wrapPageData(
        string $scope,
        array $board,
        array $filters,
        ?Fandom $fandom = null,
        ?Club $club = null,
        ?League $league = null,
        ?array $season = null,
    ): array {
        return [
            'scope' => $scope,
            'board' => $board,
            'filters' => $filters,
            'scope_options' => [
                ['value' => 'global', 'label' => 'Global'],
                ['value' => 'fandom', 'label' => 'Fandom'],
                ['value' => 'club', 'label' => 'Club'],
                ['value' => 'league', 'label' => 'League'],
                ['value' => 'season', 'label' => 'Season'],
            ],
            'fandom' => $fandom ? ['id' => $fandom->id, 'name' => $fandom->name, 'slug' => $fandom->slug] : null,
            'club' => $club ? [
                'id' => $club->id,
                'name' => $club->name,
                'short' => $club->short,
                'league' => $club->league?->name,
            ] : null,
            'league' => $league ? [
                'id' => $league->id,
                'name' => $league->name,
                'fandom' => $league->fandom?->name,
            ] : null,
            'season' => $season,
            'fandoms' => Fandom::query()->orderBy('name')->get(['id', 'name']),
            'clubs' => Club::query()->orderBy('name')->limit(200)->get(['id', 'name', 'short']),
            'leagues' => League::query()->orderBy('name')->get(['id', 'name']),
            'seasons' => Season::query()->orderByDesc('id')->get(['id', 'name']),
        ];
    }
}
