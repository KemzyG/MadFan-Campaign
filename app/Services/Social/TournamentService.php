<?php

namespace App\Services\Social;

use App\Models\Club;
use App\Models\MatchFixture;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * A "tournament" isn't a model — it's fixtures grouped by their free-text
 * `competition` field (see MatchEventProvider). This computes a real
 * standings table from finished fixtures (home_score/away_score, added for
 * Predictions) and presents the full fixture list for that competition.
 */
class TournamentService
{
    /**
     * Resolve the competition a feed card's slug refers to, since the slug
     * isn't stored anywhere — it's derived the same way the card key is.
     */
    public function resolveCompetition(string $slug): ?string
    {
        return MatchFixture::query()
            ->whereNotNull('competition')
            ->distinct()
            ->pluck('competition')
            // Same truncation MatchEventProvider applies to the card's slug.
            ->first(fn (string $competition): bool => Str::limit(Str::slug($competition), 60, '') === $slug);
    }

    /**
     * @return array<string, mixed>
     */
    public function present(string $competition): array
    {
        $fixtures = MatchFixture::query()
            ->where('competition', $competition)
            ->with(['homeClub:id,name,short,logo', 'awayClub:id,name,short,logo'])
            ->orderBy('kickoff_at')
            ->get();

        return [
            'competition' => $competition,
            'standings' => $this->standings($fixtures),
            'fixtures' => $fixtures->map(fn (MatchFixture $fixture): array => [
                'id' => $fixture->id,
                'status' => $fixture->status->value,
                'kickoff_at' => $fixture->kickoff_at?->toIso8601String(),
                'venue' => $fixture->venue,
                'home' => $this->side($fixture->homeClub),
                'away' => $this->side($fixture->awayClub),
                'home_score' => $fixture->home_score,
                'away_score' => $fixture->away_score,
            ])->values()->all(),
        ];
    }

    /**
     * @param  Collection<int, MatchFixture>  $fixtures
     * @return list<array<string, mixed>>
     */
    private function standings(Collection $fixtures): array
    {
        $clubs = collect();
        $stats = collect();

        $ensure = function (?Club $club) use (&$clubs, &$stats): void {
            if ($club === null || $stats->has($club->id)) {
                return;
            }

            $clubs->put($club->id, $club);
            $stats->put($club->id, ['played' => 0, 'won' => 0, 'drawn' => 0, 'lost' => 0, 'goals_for' => 0, 'goals_against' => 0, 'points' => 0]);
        };

        foreach ($fixtures as $fixture) {
            if (! $fixture->isFinished()) {
                continue;
            }

            $ensure($fixture->homeClub);
            $ensure($fixture->awayClub);

            if ($fixture->homeClub === null || $fixture->awayClub === null) {
                continue;
            }

            $this->applyResult($stats, $fixture->homeClub->id, $fixture->home_score, $fixture->away_score);
            $this->applyResult($stats, $fixture->awayClub->id, $fixture->away_score, $fixture->home_score);
        }

        return $stats
            ->map(fn (array $row, int $clubId): array => [...$row, 'club' => $clubs->get($clubId)])
            ->sort(function (array $a, array $b): int {
                $points = $b['points'] <=> $a['points'];
                if ($points !== 0) {
                    return $points;
                }

                $goalDifference = ($b['goals_for'] - $b['goals_against']) <=> ($a['goals_for'] - $a['goals_against']);
                if ($goalDifference !== 0) {
                    return $goalDifference;
                }

                return $b['goals_for'] <=> $a['goals_for'];
            })
            ->values()
            ->map(fn (array $row, int $index): array => [
                'position' => $index + 1,
                'club' => $this->side($row['club']),
                'played' => $row['played'],
                'won' => $row['won'],
                'drawn' => $row['drawn'],
                'lost' => $row['lost'],
                'goals_for' => $row['goals_for'],
                'goals_against' => $row['goals_against'],
                'goal_difference' => $row['goals_for'] - $row['goals_against'],
                'points' => $row['points'],
            ])
            ->all();
    }

    /**
     * @param  Collection<int, array<string, int>>  $stats
     */
    private function applyResult(Collection $stats, int $clubId, ?int $goalsFor, ?int $goalsAgainst): void
    {
        $row = $stats->get($clubId);
        $row['played']++;
        $row['goals_for'] += $goalsFor ?? 0;
        $row['goals_against'] += $goalsAgainst ?? 0;

        if ($goalsFor > $goalsAgainst) {
            $row['won']++;
            $row['points'] += 3;
        } elseif ($goalsFor === $goalsAgainst) {
            $row['drawn']++;
            $row['points'] += 1;
        } else {
            $row['lost']++;
        }

        $stats->put($clubId, $row);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function side(?Club $club): ?array
    {
        if ($club === null) {
            return null;
        }

        return [
            'id' => $club->id,
            'name' => $club->name,
            'short' => $club->short,
            'logo_url' => $club->logo_url,
        ];
    }
}
