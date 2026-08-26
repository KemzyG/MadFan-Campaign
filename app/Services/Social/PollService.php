<?php

namespace App\Services\Social;

use App\Actions\Social\AwardSocialPoints;
use App\Models\Fandom;
use App\Models\Poll;
use App\Models\PollOption;
use App\Models\PollVote;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PollService
{
    public function __construct(private AwardSocialPoints $awardSocialPoints) {}

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function openForFandom(?Fandom $fandom, ?User $viewer, int $limit = 4): Collection
    {
        return Poll::query()
            ->open()
            ->when($fandom, fn ($q) => $q->where('fandom_id', $fandom->id))
            ->with('options')
            ->latest('id')
            ->limit($limit)
            ->get()
            ->map(fn (Poll $poll) => $this->present($poll, $viewer));
    }

    /**
     * @return array<string, mixed>
     */
    public function present(Poll $poll, ?User $viewer): array
    {
        $poll->loadMissing('options');
        $total = $poll->totalVotes();

        $myVote = $viewer
            ? PollVote::query()->where('poll_id', $poll->id)->where('user_id', $viewer->id)->first()
            : null;

        return [
            'id' => $poll->id,
            'question' => $poll->question,
            'is_open' => $poll->isOpen(),
            'closes_at' => $poll->closes_at?->toIso8601String(),
            'total_votes' => $total,
            'my_option_id' => $myVote?->poll_option_id,
            'options' => $poll->options->map(fn (PollOption $option): array => [
                'id' => $option->id,
                'label' => $option->label,
                'votes_count' => $option->votes_count,
                'percent' => $total > 0 ? (int) round(($option->votes_count / $total) * 100) : 0,
            ])->values()->all(),
        ];
    }

    /**
     * @throws ValidationException
     */
    public function vote(User $user, Poll $poll, int $optionId): void
    {
        if (! $poll->isOpen()) {
            throw ValidationException::withMessages(['option_id' => 'This poll is closed.']);
        }

        $option = $poll->options()->whereKey($optionId)->first();

        if ($option === null) {
            throw ValidationException::withMessages(['option_id' => 'Invalid poll option.']);
        }

        $existing = PollVote::query()->where('poll_id', $poll->id)->where('user_id', $user->id)->first();

        if ($existing !== null && $existing->poll_option_id === $option->id) {
            return;
        }

        DB::transaction(function () use ($user, $poll, $option, $existing): void {
            if ($existing !== null) {
                PollOption::query()->whereKey($existing->poll_option_id)->decrement('votes_count');
                $existing->update(['poll_option_id' => $option->id]);
            } else {
                PollVote::query()->create([
                    'poll_id' => $poll->id,
                    'poll_option_id' => $option->id,
                    'user_id' => $user->id,
                ]);
            }

            $option->increment('votes_count');
        });

        if ($existing === null) {
            $this->awardSocialPoints->forPollVote($user, $poll->id);
        }
    }
}
