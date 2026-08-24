<?php

namespace App\Services\Social\Events;

use App\Enums\EventPhase;
use App\Enums\EventType;
use App\Enums\MatchStatus;
use App\Models\Club;
use App\Models\MatchFixture;
use App\Models\User;
use App\Support\Social\EventCard;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Fixtures → two event kinds.
 *
 * `live_match` is a single fixture that is in play, or kicks off inside the
 * next window. `tournament` is the competition above it: a `competition` value
 * with several fixtures still to come, summarised as one round card.
 *
 * `match_fixtures` carries no goals column, so these cards are kickoff/venue
 * driven rather than a live scoreline.
 */
class MatchEventProvider implements EventProvider
{
    /** How far ahead a kickoff still counts as "happening now"-adjacent. */
    private const UPCOMING_WINDOW_HOURS = 36;

    private const FIXTURE_LIMIT = 8;

    private const TOURNAMENT_LIMIT = 3;

    /** Fixtures still to play before a competition reads as a live tournament. */
    private const TOURNAMENT_MIN_FIXTURES = 2;

    public function cards(User $viewer): iterable
    {
        yield from $this->fixtureCards();
        yield from $this->tournamentCards();
    }

    /**
     * @return iterable<EventCard>
     */
    private function fixtureCards(): iterable
    {
        $fixtures = MatchFixture::query()
            ->with(['homeClub:id,name,short,logo', 'awayClub:id,name,short,logo'])
            ->where(function (Builder $query): void {
                $query->where('status', MatchStatus::Live)
                    ->orWhere(function (Builder $soon): void {
                        $soon->where('status', MatchStatus::Upcoming)
                            ->whereBetween('kickoff_at', [
                                now(),
                                now()->addHours(self::UPCOMING_WINDOW_HOURS),
                            ]);
                    });
            })
            ->orderBy('kickoff_at')
            ->limit(self::FIXTURE_LIMIT)
            ->get();

        foreach ($fixtures as $fixture) {
            $live = $fixture->status === MatchStatus::Live;
            $home = $this->side($fixture->homeClub);
            $away = $this->side($fixture->awayClub);

            $title = sprintf(
                '%s vs %s',
                $home['name'] ?? 'Home',
                $away['name'] ?? 'Away',
            );

            yield new EventCard(
                key: EventType::LiveMatch->value.':'.$fixture->id,
                type: EventType::LiveMatch,
                phase: $live ? EventPhase::Live : EventPhase::Upcoming,
                timestamp: $fixture->kickoff_at,
                headline: $title,
                subtitle: $fixture->competition,
                club: $home,
                cta: $live
                    ? ['label' => 'Watch', 'href' => '/social/fixtures']
                    : ['label' => 'Get tickets', 'href' => '/social/tickets'],
                share: ['title' => $title, 'url' => '/social/fixtures'],
                data: [
                    'home' => $home,
                    'away' => $away,
                    'kickoff_at' => $fixture->kickoff_at?->toIso8601String(),
                    'venue' => $fixture->venue,
                    'competition' => $fixture->competition,
                    'is_live' => $live,
                    'is_purchasable' => $fixture->isPurchasable(),
                ],
            );
        }
    }

    /**
     * @return iterable<EventCard>
     */
    private function tournamentCards(): iterable
    {
        $rounds = MatchFixture::query()
            ->whereNotNull('competition')
            ->whereIn('status', [MatchStatus::Upcoming, MatchStatus::Live])
            ->selectRaw('competition')
            ->selectRaw('COUNT(*) as fixture_count')
            ->selectRaw('MIN(kickoff_at) as next_kickoff')
            ->selectRaw("SUM(CASE WHEN status = 'live' THEN 1 ELSE 0 END) as live_count")
            ->groupBy('competition')
            ->havingRaw('COUNT(*) >= ?', [self::TOURNAMENT_MIN_FIXTURES])
            ->orderByRaw('MIN(kickoff_at)')
            ->limit(self::TOURNAMENT_LIMIT)
            ->get();

        foreach ($rounds as $round) {
            $competition = (string) $round->competition;
            $liveCount = (int) $round->live_count;
            $fixtureCount = (int) $round->fixture_count;
            $nextKickoff = $round->next_kickoff ? Carbon::parse($round->next_kickoff) : null;

            yield new EventCard(
                // Slug (not the raw name) so the interest key stays URL-safe and
                // within the event_key column; truncated to leave room for the prefix.
                key: EventType::Tournament->value.':'.Str::limit(Str::slug($competition), 60, ''),
                type: EventType::Tournament,
                phase: $liveCount > 0 ? EventPhase::Live : EventPhase::Upcoming,
                timestamp: $nextKickoff,
                headline: $competition,
                subtitle: $fixtureCount.' '.Str::plural('fixture', $fixtureCount).' to play',
                club: null,
                cta: ['label' => 'View table', 'href' => '/social/clubs'],
                share: ['title' => $competition, 'url' => '/social/fixtures'],
                data: [
                    'competition' => $competition,
                    'fixture_count' => $fixtureCount,
                    'live_count' => $liveCount,
                    'next_kickoff_at' => $nextKickoff?->toIso8601String(),
                    'clubs' => $this->competitionClubs($competition),
                ],
            );
        }
    }

    /**
     * Crest strip for a tournament card — the clubs still involved.
     *
     * @return list<array<string, mixed>>
     */
    private function competitionClubs(string $competition): array
    {
        $clubIds = MatchFixture::query()
            ->where('competition', $competition)
            ->whereIn('status', [MatchStatus::Upcoming, MatchStatus::Live])
            ->get(['home_club_id', 'away_club_id'])
            ->flatMap(fn (MatchFixture $fixture): array => [
                $fixture->home_club_id,
                $fixture->away_club_id,
            ])
            ->filter()
            ->unique()
            ->take(6)
            ->values();

        if ($clubIds->isEmpty()) {
            return [];
        }

        return Club::query()
            ->whereKey($clubIds)
            ->get(['id', 'name', 'short', 'logo'])
            ->map(fn (Club $club): array => $this->side($club))
            ->values()
            ->all();
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
