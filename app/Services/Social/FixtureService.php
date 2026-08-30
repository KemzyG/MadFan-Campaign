<?php

namespace App\Services\Social;

use App\Enums\MatchStatus;
use App\Enums\MatchTicketStatus;
use App\Models\MatchFixture;
use App\Models\MatchTicket;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class FixtureService
{
    public function __construct(
        private MatchTicketService $matchTicketService,
    ) {}

    /**
     * @return array{
     *     live: list<array<string, mixed>>,
     *     today: list<array<string, mixed>>,
     *     coming: list<array{date: string, label: string, matches: list<array<string, mixed>>}>,
     *     past: list<array<string, mixed>>,
     *     counts: array{live: int, today: int, coming: int, past: int}
     * }
     */
    public function boardFor(?User $user): array
    {
        // A guest owns no tickets — nothing to mark as "owned" on the board.
        $ownedMatchIds = $user === null ? [] : MatchTicket::query()
            ->where('user_id', $user->id)
            ->where('status', '!=', MatchTicketStatus::Cancelled)
            ->pluck('match_fixture_id')
            ->all();

        $startOfToday = now()->startOfDay();
        $endOfToday = now()->endOfDay();

        $fixtures = MatchFixture::query()
            ->with(['homeClub', 'awayClub'])
            ->where(function ($query) use ($startOfToday): void {
                $query
                    ->where('status', MatchStatus::Live)
                    ->orWhere('status', MatchStatus::Finished)
                    ->orWhere(function ($inner) use ($startOfToday): void {
                        $inner
                            ->where('status', MatchStatus::Upcoming)
                            ->where('kickoff_at', '>=', $startOfToday->copy()->subDay());
                    });
            })
            ->orderBy('kickoff_at')
            ->limit(120)
            ->get();

        $live = [];
        $today = [];
        $coming = [];
        $past = [];

        foreach ($fixtures as $fixture) {
            $row = $this->matchTicketService->presentMatch(
                $fixture,
                in_array($fixture->id, $ownedMatchIds, true),
            );
            $row['day_key'] = $fixture->kickoff_at?->toDateString();
            $row['day_label'] = $this->dayLabel($fixture->kickoff_at);

            if ($fixture->status === MatchStatus::Live) {
                $live[] = $row;

                continue;
            }

            if ($fixture->status === MatchStatus::Finished) {
                $past[] = $row;

                continue;
            }

            if ($fixture->kickoff_at === null) {
                continue;
            }

            if ($fixture->kickoff_at->isSameDay(now())) {
                $today[] = $row;

                continue;
            }

            if ($fixture->kickoff_at->greaterThan($endOfToday)) {
                $coming[] = $row;

                continue;
            }

            // Overdue but still marked upcoming — show with results board.
            $past[] = $row;
        }

        // Past: newest first
        $past = array_reverse($past);

        // Live: most recently kicked off first
        usort($live, function (array $a, array $b): int {
            return strcmp((string) ($b['kickoff_at'] ?? ''), (string) ($a['kickoff_at'] ?? ''));
        });

        return [
            'live' => $live,
            'today' => $today,
            'coming' => $this->groupByDay($coming),
            'past' => array_slice($past, 0, 40),
            'counts' => [
                'live' => count($live),
                'today' => count($today),
                'coming' => count($coming),
                'past' => count($past),
            ],
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $matches
     * @return list<array{date: string, label: string, matches: list<array<string, mixed>>}>
     */
    private function groupByDay(array $matches): array
    {
        /** @var Collection<string, Collection<int, array<string, mixed>>> $grouped */
        $grouped = collect($matches)->groupBy(fn (array $match): string => (string) ($match['day_key'] ?? 'unknown'));

        return $grouped
            ->map(function (Collection $dayMatches, string $date): array {
                $first = $dayMatches->first();

                return [
                    'date' => $date,
                    'label' => is_array($first) ? (string) ($first['day_label'] ?? $date) : $date,
                    'matches' => $dayMatches->values()->all(),
                ];
            })
            ->values()
            ->all();
    }

    private function dayLabel(?CarbonInterface $kickoff): string
    {
        if ($kickoff === null) {
            return '';
        }

        if ($kickoff->isToday()) {
            return 'Today';
        }

        if ($kickoff->isTomorrow()) {
            return 'Tomorrow';
        }

        return $kickoff->format('D j M');
    }
}
