<?php

namespace App\Services\Admin;

use App\Models\Club;
use App\Models\Fandom;
use App\Models\League;
use App\Models\User;
use App\Services\Social\FanLeaderboardService;

class AdminLeaderboardService
{
    public function __construct(
        private FanLeaderboardService $leaderboard,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function pageData(
        string $scope = 'global',
        ?int $fandomId = null,
        ?int $clubId = null,
        ?int $leagueId = null,
        int $limit = 50,
    ): array {
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
            'scope' => $scope,
            'board' => [
                ...$board,
                'entries' => $entries,
            ],
            'filters' => [
                'scope' => $scope,
                'fandom_id' => $fandom?->id,
                'club_id' => $club?->id,
                'league_id' => $league?->id,
                'limit' => $limit,
            ],
            'scope_options' => [
                ['value' => 'global', 'label' => 'Global'],
                ['value' => 'fandom', 'label' => 'Fandom'],
                ['value' => 'club', 'label' => 'Club'],
                ['value' => 'league', 'label' => 'League'],
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
            'fandoms' => Fandom::query()->orderBy('name')->get(['id', 'name']),
            'clubs' => Club::query()->orderBy('name')->limit(200)->get(['id', 'name', 'short']),
            'leagues' => League::query()->orderBy('name')->get(['id', 'name']),
        ];
    }
}
