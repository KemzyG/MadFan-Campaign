<?php

namespace App\Actions;

use App\Models\PointTransaction;
use App\Models\Season;
use App\Models\Task;
use App\Models\User;
use App\Models\UserTaskProgress;
use App\Models\WeeklyProgress;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReviewTaskSubmission
{
    /**
     * Approve a pending task submission and award points.
     *
     * @return array{message: string, points_awarded: int, new_total_points: int}
     */
    public function approve(UserTaskProgress $progress, ?User $reviewer = null): array
    {
        $progress->loadMissing(['task', 'user']);

        if ($progress->verification_status !== 'pending' || $progress->status !== 'confirmed') {
            throw ValidationException::withMessages([
                'progress' => 'Only submissions awaiting review can be approved.',
            ]);
        }

        if ($progress->status === 'claimed') {
            throw ValidationException::withMessages([
                'progress' => 'This task has already been claimed.',
            ]);
        }

        $task = $progress->task;
        $user = $progress->user;

        if (! $task instanceof Task || ! $user instanceof User) {
            throw ValidationException::withMessages([
                'progress' => 'Task submission is incomplete.',
            ]);
        }

        return DB::transaction(function () use ($progress, $task, $user, $reviewer) {
            $locked = UserTaskProgress::query()->whereKey($progress->id)->lockForUpdate()->firstOrFail();

            if ($locked->status === 'claimed') {
                throw ValidationException::withMessages([
                    'progress' => 'This task has already been claimed.',
                ]);
            }

            $idempotencyKey = 'task-claim-'.$user->id.'-'.$task->id;

            if (PointTransaction::query()->where('idempotency_key', $idempotencyKey)->exists()) {
                $locked->forceFill([
                    'verification_status' => 'verified',
                    'verified_at' => now(),
                    'failed_at' => null,
                    'failure_reason' => null,
                    'status' => 'claimed',
                    'claimed_at' => $locked->claimed_at ?? now(),
                ])->save();

                return [
                    'message' => 'Task was already awarded.',
                    'points_awarded' => (int) ($locked->points_awarded ?? $task->points),
                    'new_total_points' => (int) $user->fresh()->total_points,
                ];
            }

            $newBalance = (int) $user->total_points + (int) $task->points;

            $transaction = PointTransaction::query()->create([
                'user_id' => $user->id,
                'season_id' => $task->season_id,
                'source_type' => 'task',
                'source_id' => (string) $task->id,
                'amount' => $task->points,
                'balance_after' => $newBalance,
                'reason' => "Task approved: {$task->name}",
                'metadata' => [
                    'reviewed_by' => $reviewer?->id,
                    'review' => 'approved',
                ],
                'idempotency_key' => $idempotencyKey,
            ]);

            $locked->forceFill([
                'status' => 'claimed',
                'verification_status' => 'verified',
                'verified_at' => now(),
                'confirmed_at' => $locked->confirmed_at ?? now(),
                'claimed_at' => now(),
                'failed_at' => null,
                'failure_reason' => null,
                'points_awarded' => $task->points,
                'point_transaction_id' => $transaction->id,
            ])->save();

            $user->increment('total_points', $task->points);
            $this->bumpWeeklyProgress($user, $task);

            return [
                'message' => 'Task approved and points awarded.',
                'points_awarded' => (int) $task->points,
                'new_total_points' => (int) $user->fresh()->total_points,
            ];
        });
    }

    /**
     * Reject a pending task submission.
     *
     * @return array{message: string}
     */
    public function reject(UserTaskProgress $progress, string $reason, ?User $reviewer = null): array
    {
        $reason = trim($reason);

        if ($reason === '') {
            throw ValidationException::withMessages([
                'reason' => 'A rejection reason is required.',
            ]);
        }

        if ($progress->status === 'claimed') {
            throw ValidationException::withMessages([
                'progress' => 'Claimed tasks cannot be rejected.',
            ]);
        }

        $progress->forceFill([
            'status' => 'rejected',
            'verification_status' => 'failed',
            'failed_at' => now(),
            'failure_reason' => $reason,
            'verified_at' => null,
            'verification_payload' => array_merge(
                is_array($progress->verification_payload) ? $progress->verification_payload : [],
                [
                    'reviewed_by' => $reviewer?->id,
                    'review' => 'rejected',
                    'rejected_at' => now()->toIso8601String(),
                ],
            ),
        ])->save();

        return [
            'message' => 'Task submission rejected.',
        ];
    }

    protected function bumpWeeklyProgress(User $user, Task $task): void
    {
        $season = Season::query()->where('status', 'active')->latest('starts_at')->first();

        if (! $season) {
            return;
        }

        $activeWeek = $season->seasonWeeks()->where('is_active', true)->first();

        if (! $activeWeek) {
            return;
        }

        $weeklyProgress = WeeklyProgress::query()->firstOrCreate(
            ['user_id' => $user->id, 'season_week_id' => $activeWeek->id],
            [
                'season_id' => $season->id,
                'tasks_done' => 0,
                'tasks_total' => Task::query()->where('season_id', $season->id)->where('is_active', true)->count(),
                'completion_bonus_awarded' => false,
                'completion_bonus_points' => $activeWeek->completion_bonus_points,
            ],
        );

        $weeklyProgress->increment('tasks_done');
    }
}
