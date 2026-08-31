<?php

namespace App\Services\Social;

use App\Actions\Social\AwardSocialPoints;
use App\Models\Fandom;
use App\Models\Showdown;
use App\Models\ShowdownVote;
use App\Models\ShowdownVoteEvent;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Fan-vs-fan head-to-head voting: two contestants, unlimited taps per voter,
 * the side you pick locks for good (see vote()). Points are capped per day
 * across all showdowns, not per showdown — see AwardSocialPoints — so the
 * tap count itself stays the real, uncapped scoreboard.
 */
class ShowdownService
{
    private const RECENT_ACTIVITY_LIMIT = 12;

    public function __construct(private AwardSocialPoints $awardSocialPoints) {}

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function openForFandom(?Fandom $fandom, ?User $viewer, int $limit = 3): Collection
    {
        return Showdown::query()
            ->open()
            ->when($fandom, fn ($q) => $q->where('fandom_id', $fandom->id))
            ->with(['contestantA:id,name,handle,fan_id,avatar_path,avatar_emoji', 'contestantB:id,name,handle,fan_id,avatar_path,avatar_emoji'])
            ->latest('id')
            ->limit($limit)
            ->get()
            ->map(fn (Showdown $showdown) => $this->present($showdown, $viewer));
    }

    /**
     * @return Collection<int, Showdown>
     */
    public function openForFeed(int $limit = 6): Collection
    {
        return Showdown::query()
            ->open()
            ->with(['contestantA:id,name,handle,fan_id,avatar_path,avatar_emoji', 'contestantB:id,name,handle,fan_id,avatar_path,avatar_emoji'])
            ->latest('id')
            ->limit($limit)
            ->get();
    }

    /**
     * @return array<string, mixed>
     */
    public function present(Showdown $showdown, ?User $viewer): array
    {
        $showdown->loadMissing(['contestantA:id,name,handle,fan_id,avatar_path,avatar_emoji', 'contestantB:id,name,handle,fan_id,avatar_path,avatar_emoji']);
        $total = $showdown->totalVotes();

        $mine = $viewer
            ? ShowdownVote::query()->where('showdown_id', $showdown->id)->where('user_id', $viewer->id)->first()
            : null;

        return [
            'id' => $showdown->id,
            'title' => $showdown->title,
            'is_open' => $showdown->isOpen(),
            'closes_at' => $showdown->closes_at?->toIso8601String(),
            'total_votes' => $total,
            'my_side' => $mine?->side,
            'my_taps' => $mine?->tap_count ?? 0,
            'contestant_a' => $this->presentContestant($showdown->contestantA, $showdown->votes_a, $total),
            'contestant_b' => $this->presentContestant($showdown->contestantB, $showdown->votes_b, $total),
            'recent_activity' => $this->recentActivity($showdown),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function presentContestant(?User $user, int $votes, int $total): array
    {
        return [
            'id' => $user?->id,
            'name' => $user?->name,
            'handle' => $user?->handle ?: $user?->fan_id,
            'avatar_url' => $user?->avatar_url,
            'votes' => $votes,
            'percent' => $total > 0 ? (int) round(($votes / $total) * 100) : 0,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function recentActivity(Showdown $showdown): array
    {
        return $showdown->voteEvents()
            ->with('user:id,name,handle,fan_id')
            ->latest('id')
            ->limit(self::RECENT_ACTIVITY_LIMIT)
            ->get()
            ->map(fn (ShowdownVoteEvent $event): array => [
                'id' => $event->id,
                'side' => $event->side,
                'user_name' => $event->user?->name ?: ($event->user?->handle ?: 'A fan'),
                'created_at' => $event->created_at?->toIso8601String(),
            ])
            ->values()
            ->all();
    }

    /**
     * @throws ValidationException
     */
    public function vote(User $user, Showdown $showdown, string $side): array
    {
        if (! in_array($side, [Showdown::SIDE_A, Showdown::SIDE_B], true)) {
            throw ValidationException::withMessages(['side' => 'Invalid showdown side.']);
        }

        if (! $showdown->isOpen()) {
            throw ValidationException::withMessages(['side' => 'This showdown is closed.']);
        }

        DB::transaction(function () use ($user, $showdown, $side): void {
            $vote = ShowdownVote::query()
                ->where('showdown_id', $showdown->id)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->first();

            if ($vote !== null && $vote->side !== $side) {
                throw ValidationException::withMessages([
                    'side' => 'You already picked the other side — that choice is locked in.',
                ]);
            }

            if ($vote === null) {
                try {
                    $vote = ShowdownVote::query()->create([
                        'showdown_id' => $showdown->id,
                        'user_id' => $user->id,
                        'side' => $side,
                    ]);
                } catch (QueryException) {
                    // Two taps raced on this user's very first vote — the
                    // unique (showdown_id, user_id) index let one win; pick
                    // up the row it created instead of failing the request.
                    $vote = ShowdownVote::query()
                        ->where('showdown_id', $showdown->id)
                        ->where('user_id', $user->id)
                        ->lockForUpdate()
                        ->firstOrFail();

                    if ($vote->side !== $side) {
                        throw ValidationException::withMessages([
                            'side' => 'You already picked the other side — that choice is locked in.',
                        ]);
                    }
                }
            }

            $vote->increment('tap_count');
            $showdown->increment($side === Showdown::SIDE_A ? 'votes_a' : 'votes_b');

            ShowdownVoteEvent::query()->create([
                'showdown_id' => $showdown->id,
                'user_id' => $user->id,
                'side' => $side,
            ]);

            $transaction = $this->awardSocialPoints->forShowdownVote($user, $showdown->id, $vote->tap_count);
            if ($transaction !== null) {
                $vote->increment('points_awarded');
            }
        });

        return $this->present($showdown->fresh(), $user);
    }
}
