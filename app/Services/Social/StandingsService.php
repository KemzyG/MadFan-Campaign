<?php

namespace App\Services\Social;

use App\Models\Club;
use App\Models\League;
use App\Models\LeagueStanding;
use App\Models\User;

class StandingsService
{
    /**
     * @return list<array{
     *     id: int,
     *     name: string,
     *     short: string,
     *     logo_url: string
     * }>
     */
    public function presentLeagues(): array
    {
        return League::query()
            ->whereHas('standings')
            ->orderBy('name')
            ->get(['id', 'name', 'short', 'logo'])
            ->map(static fn (League $league): array => [
                'id' => $league->id,
                'name' => $league->name,
                'short' => $league->short,
                'logo_url' => $league->logo_url,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array{
     *     league: array{id: int, name: string, short: string, logo_url: string},
     *     rows: list<array{
     *         position: int,
     *         club: array{id: int, name: string, short: string, logo_url: string},
     *         played: int,
     *         won: int,
     *         drawn: int,
     *         lost: int,
     *         goals_for: int,
     *         goals_against: int,
     *         goal_difference: int,
     *         points: int,
     *         is_favourite: bool
     *     }>
     * }|null
     */
    public function presentTable(League $league, ?User $user = null): ?array
    {
        $rows = LeagueStanding::query()
            ->with(['club:id,league_id,name,short,logo'])
            ->where('league_id', $league->id)
            ->get()
            ->sort(function (LeagueStanding $left, LeagueStanding $right): int {
                return $this->compareRows($left, $right);
            })
            ->values();

        if ($rows->isEmpty()) {
            return null;
        }

        $favouriteClubId = $user?->favourite_club_id;

        return [
            'league' => [
                'id' => $league->id,
                'name' => $league->name,
                'short' => $league->short,
                'logo_url' => $league->logo_url,
            ],
            'rows' => $rows->map(function (LeagueStanding $standing, int $index) use ($favouriteClubId): array {
                $club = $standing->club;

                return [
                    'position' => $index + 1,
                    'club' => [
                        'id' => $club->id,
                        'name' => $club->name,
                        'short' => $club->short,
                        'logo_url' => $club->logo_url,
                    ],
                    'played' => $standing->played,
                    'won' => $standing->won,
                    'drawn' => $standing->drawn,
                    'lost' => $standing->lost,
                    'goals_for' => $standing->goals_for,
                    'goals_against' => $standing->goals_against,
                    'goal_difference' => $standing->goalDifference(),
                    'points' => $standing->points,
                    'is_favourite' => $favouriteClubId !== null && $club->id === $favouriteClubId,
                ];
            })->all(),
        ];
    }

    /**
     * A single club's standings row plus its league context — the data shape
     * a club profile page needs, without making the caller pick a league first.
     *
     * @return array{
     *     league: array{id: int, name: string, short: string, logo_url: string},
     *     row: array<string, mixed>,
     *     total_clubs: int
     * }|null
     */
    public function standingForClub(Club $club, ?User $user = null): ?array
    {
        if ($club->league_id === null) {
            return null;
        }

        $league = League::query()->find($club->league_id);

        if ($league === null) {
            return null;
        }

        $table = $this->presentTable($league, $user);

        if ($table === null) {
            return null;
        }

        $row = collect($table['rows'])->first(fn (array $row) => $row['club']['id'] === $club->id);

        if ($row === null) {
            return null;
        }

        return [
            'league' => $table['league'],
            'row' => $row,
            'total_clubs' => count($table['rows']),
        ];
    }

    public function resolveLeague(?int $leagueId, ?User $user = null): ?League
    {
        if ($leagueId !== null) {
            return League::query()->find($leagueId);
        }

        if ($user?->favourite_club_id !== null) {
            $favouriteLeagueId = Club::query()
                ->whereKey($user->favourite_club_id)
                ->value('league_id');

            if ($favouriteLeagueId !== null) {
                return League::query()->find($favouriteLeagueId);
            }
        }

        return League::query()
            ->whereHas('standings')
            ->orderBy('name')
            ->first();
    }

    private function compareRows(LeagueStanding $left, LeagueStanding $right): int
    {
        return $right->points <=> $left->points
            ?: $right->goalDifference() <=> $left->goalDifference()
            ?: $right->goals_for <=> $left->goals_for
            ?: $left->club->name <=> $right->club->name;
    }
}
