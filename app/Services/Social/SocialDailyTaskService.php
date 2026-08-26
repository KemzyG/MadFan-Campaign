<?php

namespace App\Services\Social;

use App\Enums\PointSourceType;
use App\Enums\PostType;
use App\Models\PointTransaction;
use App\Models\Post;
use App\Models\PostLike;
use App\Models\Season;
use App\Models\SocialDailyTaskClaim;
use App\Models\StageParticipant;
use App\Models\User;
use App\Models\VideoHighlight;
use App\Support\Social\DailyTaskCatalog;
use Illuminate\Database\QueryException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Progress for every task is computed live from the tables that already
 * record the underlying activity (posts, likes, videos, Stage sessions) —
 * there's no separate progress counter to keep in sync or drift out of date.
 * The only persisted state is the once-a-day reward claim itself.
 */
class SocialDailyTaskService
{
    public function __construct(private SocialPassportService $socialPassport) {}

    /**
     * @return array<string, mixed>
     */
    public function today(User $user): array
    {
        return $this->present($user, Carbon::now());
    }

    /**
     * @return array<string, mixed>
     */
    public function present(User $user, Carbon $date): array
    {
        $tier = DailyTaskCatalog::tierFor($date);
        $progress = $this->progressFor($user, $date);

        $tasks = collect(DailyTaskCatalog::tasksFor($date))
            ->map(function (array $def) use ($progress): array {
                $current = min($def['target'], $progress[$def['key']] ?? 0);

                return [
                    ...$def,
                    'progress' => $current,
                    'percent' => $def['target'] > 0 ? (int) round(($current / $def['target']) * 100) : 100,
                    'completed' => $current >= $def['target'],
                ];
            })
            ->values()
            ->all();

        $allCompleted = collect($tasks)->every(fn (array $task): bool => $task['completed']);

        $claim = SocialDailyTaskClaim::query()
            ->where('user_id', $user->id)
            ->whereDate('claim_date', $date->toDateString())
            ->first();

        return [
            'date' => $date->toDateString(),
            'week_label' => DailyTaskCatalog::weekLabel($tier),
            'tier' => $tier,
            'tasks' => $tasks,
            'completed_count' => collect($tasks)->where('completed', true)->count(),
            'total_count' => count($tasks),
            'all_completed' => $allCompleted,
            'reward_points' => DailyTaskCatalog::rewardFor($date),
            'claimed' => $claim !== null,
            'claimed_points' => $claim?->points_awarded,
            'claimed_at' => $claim?->claimed_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, int>
     */
    private function progressFor(User $user, Carbon $date): array
    {
        $day = $date->toDateString();

        return [
            'post' => Post::query()
                ->where('author_id', $user->id)
                ->where('type', PostType::Status)
                ->whereNull('reply_to_id')
                ->whereDate('created_at', $day)
                ->count(),
            'like' => PostLike::query()
                ->where('user_id', $user->id)
                ->whereDate('created_at', $day)
                ->count(),
            'video' => VideoHighlight::query()
                ->where('author_id', $user->id)
                ->whereDate('created_at', $day)
                ->count(),
            'comment' => Post::query()
                ->where('author_id', $user->id)
                ->whereNotNull('reply_to_id')
                ->whereDate('created_at', $day)
                ->distinct()
                ->count('reply_to_id'),
            'stage' => $this->stageMinutes($user, $date),
        ];
    }

    private function stageMinutes(User $user, Carbon $date): int
    {
        $start = $date->copy()->startOfDay();
        $end = $date->copy()->endOfDay();
        $now = Carbon::now();

        $seconds = StageParticipant::query()
            ->where('user_id', $user->id)
            ->whereNotNull('joined_at')
            ->whereBetween('joined_at', [$start, $end])
            ->get(['joined_at', 'left_at'])
            ->sum(function (StageParticipant $participant) use ($end, $now): int {
                $leftAt = $participant->left_at ?? $now;
                if ($leftAt->greaterThan($end)) {
                    $leftAt = $end;
                }

                return max(0, $participant->joined_at->diffInSeconds($leftAt));
            });

        return intdiv((int) $seconds, 60);
    }

    /**
     * @return array<string, mixed>
     *
     * @throws ValidationException
     */
    public function claim(User $user): array
    {
        $date = Carbon::now();
        $today = $this->present($user, $date);

        if (! $today['all_completed']) {
            throw ValidationException::withMessages([
                'claim' => 'Finish every task before claiming today\'s reward.',
            ]);
        }

        if ($today['claimed']) {
            throw ValidationException::withMessages([
                'claim' => 'Already claimed today.',
            ]);
        }

        $points = $today['reward_points'];
        $sourceType = PointSourceType::SocialDailyTask->value;
        $idempotencyKey = "{$sourceType}-{$user->id}-{$today['date']}";

        try {
            return DB::transaction(function () use ($user, $date, $today, $points, $sourceType, $idempotencyKey): array {
                // The unique (user_id, claim_date) index — and the idempotency
                // key's unique index on point_transactions — reject a second
                // concurrent claim even if two requests both passed the check above.
                $claim = SocialDailyTaskClaim::query()->create([
                    'user_id' => $user->id,
                    'claim_date' => $today['date'],
                    'week_index' => $today['tier'],
                    'points_awarded' => $points,
                ]);

                $season = Season::query()->where('status', 'active')->latest('starts_at')->first();
                $user->refresh();
                $newBalance = (int) $user->total_points + $points;

                $transaction = PointTransaction::query()->create([
                    'user_id' => $user->id,
                    'season_id' => $season?->id,
                    'source_type' => $sourceType,
                    'source_id' => (string) $claim->id,
                    'amount' => $points,
                    'balance_after' => $newBalance,
                    'reason' => 'Daily tasks completed — '.$today['week_label'],
                    'idempotency_key' => $idempotencyKey,
                ]);

                $claim->update([
                    'point_transaction_id' => $transaction->id,
                    'claimed_at' => now(),
                ]);

                $user->increment('total_points', $points);
                $user->refresh();
                $this->socialPassport->syncSnapshot($user);

                return $this->present($user, $date);
            });
        } catch (QueryException) {
            throw ValidationException::withMessages([
                'claim' => 'Already claimed today.',
            ]);
        }
    }
}
