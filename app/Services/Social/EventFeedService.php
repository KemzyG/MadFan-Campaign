<?php

namespace App\Services\Social;

use App\Enums\EventType;
use App\Models\SocialEventInterest;
use App\Models\User;
use App\Services\Social\Events\AnnouncementEventProvider;
use App\Services\Social\Events\CampaignEventProvider;
use App\Services\Social\Events\ChallengeEventProvider;
use App\Services\Social\Events\EpisodeEventProvider;
use App\Services\Social\Events\EventProvider;
use App\Services\Social\Events\MatchEventProvider;
use App\Services\Social\Events\ShowdownEventProvider;
use App\Services\Social\Events\StageEventProvider;
use App\Support\Social\EventCard;
use Illuminate\Support\Collection;

/**
 * The Social "🔴 What's happening NOW" feed.
 *
 * Merges every {@see EventProvider} into one ordered stream: live first, then
 * what's about to start, then what just landed. Each card keeps its own type so
 * the client can dispatch to that type's template.
 */
class EventFeedService
{
    public const PER_PAGE = 20;

    /** @var list<class-string<EventProvider>> */
    private const PROVIDERS = [
        MatchEventProvider::class,
        StageEventProvider::class,
        AnnouncementEventProvider::class,
        EpisodeEventProvider::class,
        ChallengeEventProvider::class,
        CampaignEventProvider::class,
        ShowdownEventProvider::class,
    ];

    /**
     * Every event card for the viewer, ordered and interest-decorated.
     *
     * @return Collection<int, EventCard>
     */
    public function cards(?User $viewer): Collection
    {
        $cards = collect(self::PROVIDERS)
            ->flatMap(fn (string $provider): array => iterator_to_array(
                app($provider)->cards($viewer),
                false,
            ))
            // A provider mints one card per source row, but two providers could
            // in principle land on the same key; keep the first.
            ->unique(fn (EventCard $card): string => $card->key)
            ->values();

        return $this->withInterest($this->sort($cards), $viewer);
    }

    /**
     * Live → upcoming → recent; inside a phase, pinned first, then by time
     * (soonest first for upcoming, newest first otherwise).
     *
     * @param  Collection<int, EventCard>  $cards
     * @return Collection<int, EventCard>
     */
    protected function sort(Collection $cards): Collection
    {
        return $cards
            ->sort(function (EventCard $a, EventCard $b): int {
                $phase = $a->phase->weight() <=> $b->phase->weight();
                if ($phase !== 0) {
                    return $phase;
                }

                $pinned = ($b->isPinned <=> $a->isPinned);
                if ($pinned !== 0) {
                    return $pinned;
                }

                $time = $a->sortTime() <=> $b->sortTime();

                return $a->phase->sortsAscending() ? $time : -$time;
            })
            ->values();
    }

    /**
     * Decorate cards with the viewer's interest mark and the global count.
     * One query for the counts, one for the viewer's own marks.
     *
     * @param  Collection<int, EventCard>  $cards
     * @return Collection<int, EventCard>
     */
    protected function withInterest(Collection $cards, ?User $viewer): Collection
    {
        if ($cards->isEmpty()) {
            return $cards;
        }

        $keys = $cards->map(fn (EventCard $card): string => $card->key)->all();

        $counts = SocialEventInterest::query()
            ->whereIn('event_key', $keys)
            ->groupBy('event_key')
            ->selectRaw('event_key, COUNT(*) as aggregate')
            ->pluck('aggregate', 'event_key');

        // A guest has never marked interest in anything — skip the query
        // rather than run it against a null user_id.
        $mine = $viewer === null ? collect() : SocialEventInterest::query()
            ->where('user_id', $viewer->id)
            ->whereIn('event_key', $keys)
            ->pluck('event_key')
            ->flip();

        return $cards->map(fn (EventCard $card): EventCard => $card->withInterest(
            (int) ($counts[$card->key] ?? 0),
            $mine->has($card->key),
        ))->values();
    }

    /**
     * Page the merged stream. The sources are heterogeneous and already capped
     * per provider, so this slices in memory rather than paginating SQL.
     *
     * Takes the collection rather than re-deriving it so one {@see cards()} pass
     * feeds both this and {@see filters()}.
     *
     * @param  Collection<int, EventCard>  $cards
     * @return array{data: list<array<string, mixed>>, meta: array<string, mixed>, links: array<string, string|null>}
     */
    public function paginate(Collection $cards, int $page = 1, ?EventType $only = null): array
    {
        if ($only !== null) {
            $cards = $cards->filter(fn (EventCard $card): bool => $card->type === $only)->values();
        }

        $page = max(1, $page);
        $lastPage = max(1, (int) ceil($cards->count() / self::PER_PAGE));

        $slice = $cards
            ->slice(($page - 1) * self::PER_PAGE, self::PER_PAGE)
            ->map(fn (EventCard $card): array => $card->toArray())
            ->values()
            ->all();

        $query = $only !== null ? ['type' => $only->value] : [];

        // Relative, and taken from the live request rather than hardcoded: the
        // events page is `/social` on the path mount but `/` on the subdomain
        // mount, and Social links must stay origin-agnostic.
        $path = request()->getPathInfo();

        return [
            'data' => $slice,
            'meta' => [
                'current_page' => $page,
                'last_page' => $lastPage,
                'per_page' => self::PER_PAGE,
                'total' => $cards->count(),
            ],
            'links' => [
                'next' => $page < $lastPage
                    ? $path.'?'.http_build_query([...$query, 'page' => $page + 1])
                    : null,
                'prev' => $page > 1
                    ? $path.'?'.http_build_query([...$query, 'page' => $page - 1])
                    : null,
            ],
        ];
    }

    /**
     * Type filters for the events toolbar, with how many cards each holds.
     *
     * @param  Collection<int, EventCard>  $cards
     * @return list<array<string, mixed>>
     */
    public function filters(Collection $cards): array
    {
        $counts = $cards->countBy(fn (EventCard $card): string => $card->type->value);

        return collect(EventType::cases())
            ->filter(fn (EventType $type): bool => ($counts[$type->value] ?? 0) > 0)
            ->map(fn (EventType $type): array => [
                'type' => $type->value,
                'label' => $type->label(),
                'count' => (int) $counts[$type->value],
            ])
            ->values()
            ->all();
    }
}
