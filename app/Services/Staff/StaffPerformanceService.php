<?php

namespace App\Services\Staff;

use App\Enums\TaskAudience;
use App\Models\ActivityLog;
use App\Models\DailyClaim;
use App\Models\Task;
use App\Models\User;
use App\Models\UserTaskProgress;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class StaffPerformanceService
{
    /**
     * @return array<string, mixed>
     */
    public function forUser(User $user): array
    {
        $now = now();
        $taskQuery = UserTaskProgress::query()->where('user_id', $user->id);
        $staffTaskIds = Task::query()
            ->where('audience', TaskAudience::Staff->value)
            ->pluck('id');

        $completedStatuses = ['claimed', 'completed'];
        $pendingStatuses = ['pending', 'confirmed'];
        $failedStatuses = ['failed', 'rejected'];

        $completedTasks = (clone $taskQuery)->whereIn('status', $completedStatuses)->count();
        $pendingTasks = (clone $taskQuery)->whereIn('status', $pendingStatuses)->count();
        $failedTasks = (clone $taskQuery)->whereIn('status', $failedStatuses)->count();
        $staffCompletedTasks = (clone $taskQuery)
            ->whereIn('task_id', $staffTaskIds)
            ->whereIn('status', $completedStatuses)
            ->count();
        $staffPendingTasks = (clone $taskQuery)
            ->whereIn('task_id', $staffTaskIds)
            ->whereIn('status', $pendingStatuses)
            ->count();

        $dailyClaimsToday = DailyClaim::query()
            ->where('user_id', $user->id)
            ->whereDate('claimed_at', $now->toDateString())
            ->count();

        $weeklyClaims = DailyClaim::query()
            ->where('user_id', $user->id)
            ->where('claimed_at', '>=', $now->copy()->startOfWeek())
            ->count();

        $monthlyClaims = DailyClaim::query()
            ->where('user_id', $user->id)
            ->where('claimed_at', '>=', $now->copy()->startOfMonth())
            ->count();

        $performanceScore = $this->calculatePerformanceScore(
            totalPoints: (int) $user->total_points,
            referrals: (int) $user->referral_count,
            completedTasks: $completedTasks,
            failedTasks: $failedTasks,
            streakDays: (int) $user->current_streak_days,
        );

        return [
            'total_points' => (int) $user->total_points,
            'total_referrals' => (int) $user->referral_count,
            'completed_tasks' => $completedTasks,
            'pending_tasks' => $pendingTasks,
            'failed_tasks' => $failedTasks,
            'staff_completed_tasks' => $staffCompletedTasks,
            'staff_pending_tasks' => $staffPendingTasks,
            'daily_claims_today' => $dailyClaimsToday,
            'weekly_claims' => $weeklyClaims,
            'monthly_claims' => $monthlyClaims,
            'current_streak_days' => (int) $user->current_streak_days,
            'best_streak_days' => (int) $user->best_streak_days,
            'last_login_at' => $user->last_login_at?->toIso8601String(),
            'last_active_at' => $this->resolveLastActiveAt($user)?->toIso8601String(),
            'performance_score' => $performanceScore,
            'staff_rank' => $this->staffRankForUser($user, $performanceScore),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function leaderboard(int $limit = 10): array
    {
        return User::query()
            ->where('is_staff', true)
            ->where('staff_status', 'active')
            ->orderByDesc('total_points')
            ->orderBy('id')
            ->limit($limit)
            ->get()
            ->map(function (User $user): array {
                $performance = $this->forUser($user);

                return [
                    'user_id' => $user->id,
                    'name' => $user->name,
                    'fan_id' => $user->fan_id,
                    'staff_position' => $user->staff_position,
                    'performance_score' => $performance['performance_score'],
                    'total_points' => $performance['total_points'],
                    'total_referrals' => $performance['total_referrals'],
                    'completed_tasks' => $performance['completed_tasks'],
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Staff-audience tasks assigned to this member, with live progress.
     *
     * @return list<array<string, mixed>>
     */
    public function trackedAssignments(User $user): array
    {
        $progressByTaskId = UserTaskProgress::query()
            ->where('user_id', $user->id)
            ->get()
            ->keyBy('task_id');

        return Task::query()
            ->visibleToStaffUser($user)
            ->orderBy('display_order')
            ->get()
            ->map(function (Task $task) use ($user, $progressByTaskId): array {
                /** @var UserTaskProgress|null $progress */
                $progress = $progressByTaskId->get($task->id);
                $assignmentType = $this->assignmentTypeFor($task, $user);

                return [
                    'id' => $task->id,
                    'name' => $task->name,
                    'code' => $task->code,
                    'points' => (int) $task->points,
                    'task_type' => $task->task_type,
                    'is_active' => (bool) $task->is_active,
                    'assignment_type' => $assignmentType,
                    'assignment_label' => match ($assignmentType) {
                        'direct' => 'Direct assignment',
                        'position' => 'Position task',
                        default => 'All staff',
                    },
                    'status' => $progress?->status ?? 'not_started',
                    'verification_status' => $progress?->verification_status,
                    'points_awarded' => (int) ($progress?->points_awarded ?? 0),
                    'failure_reason' => $progress?->failure_reason,
                    'confirmed_at' => $progress?->confirmed_at?->toIso8601String(),
                    'claimed_at' => $progress?->claimed_at?->toIso8601String(),
                    'failed_at' => $progress?->failed_at?->toIso8601String(),
                    'last_activity_at' => $this->progressOccurredAt($progress)?->toIso8601String(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Chronological feed of staff task work and related assignment events.
     *
     * @return list<array<string, mixed>>
     */
    public function activityTimeline(User $user, int $limit = 40): array
    {
        $staffTaskIds = Task::query()
            ->visibleToStaffUser($user)
            ->pluck('id');

        $progressEvents = UserTaskProgress::query()
            ->with('task:id,name,code,points')
            ->where('user_id', $user->id)
            ->whereIn('task_id', $staffTaskIds)
            ->latest('updated_at')
            ->limit($limit)
            ->get()
            ->flatMap(fn (UserTaskProgress $progress): Collection => $this->timelineEventsFromProgress($progress));

        $assignmentEvents = ActivityLog::query()
            ->where(function ($query) use ($user): void {
                $query->where(function ($query) use ($user): void {
                    $query->whereIn('event', [
                        'staff.position_assigned',
                        'staff.position_updated',
                        'staff.position_removed',
                        'staff.status_updated',
                    ])->where('properties->user_id', $user->id);
                })->orWhere(function ($query) use ($user): void {
                    $query->whereIn('event', [
                        'task.staff_assigned',
                        'task.staff_unassigned',
                    ])->where('properties->assigned_user_id', $user->id);
                });
            })
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn (ActivityLog $log): array => [
                'type' => 'admin_event',
                'event' => $log->event,
                'title' => $this->activityTitle($log->event),
                'description' => $log->description,
                'status' => null,
                'occurred_at' => $log->created_at?->toIso8601String(),
                'meta' => $log->properties ?? [],
            ]);

        return $progressEvents
            ->concat($assignmentEvents)
            ->sortByDesc('occurred_at')
            ->take($limit)
            ->values()
            ->all();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    protected function timelineEventsFromProgress(UserTaskProgress $progress): Collection
    {
        $taskName = $progress->task?->name ?? 'Staff task';
        $events = collect();

        if ($progress->claimed_at) {
            $events->push([
                'type' => 'task_progress',
                'event' => 'staff.task_claimed',
                'title' => 'Claimed reward',
                'description' => "Claimed points for \"{$taskName}\"",
                'status' => 'claimed',
                'occurred_at' => $progress->claimed_at->toIso8601String(),
                'meta' => [
                    'task_id' => $progress->task_id,
                    'task_code' => $progress->task?->code,
                    'points_awarded' => (int) $progress->points_awarded,
                ],
            ]);
        }

        if ($progress->failed_at) {
            $events->push([
                'type' => 'task_progress',
                'event' => 'staff.task_failed',
                'title' => 'Task failed',
                'description' => $progress->failure_reason
                    ? "Failed \"{$taskName}\": {$progress->failure_reason}"
                    : "Failed \"{$taskName}\"",
                'status' => 'failed',
                'occurred_at' => $progress->failed_at->toIso8601String(),
                'meta' => [
                    'task_id' => $progress->task_id,
                    'task_code' => $progress->task?->code,
                ],
            ]);
        }

        if ($progress->confirmed_at) {
            $events->push([
                'type' => 'task_progress',
                'event' => 'staff.task_confirmed',
                'title' => 'Submitted / confirmed',
                'description' => "Confirmed work on \"{$taskName}\"",
                'status' => $progress->status,
                'occurred_at' => $progress->confirmed_at->toIso8601String(),
                'meta' => [
                    'task_id' => $progress->task_id,
                    'task_code' => $progress->task?->code,
                    'verification_status' => $progress->verification_status,
                ],
            ]);
        }

        if ($events->isEmpty() && $progress->updated_at) {
            $events->push([
                'type' => 'task_progress',
                'event' => 'staff.task_updated',
                'title' => 'Progress updated',
                'description' => "Updated \"{$taskName}\" ({$progress->status})",
                'status' => $progress->status,
                'occurred_at' => $progress->updated_at->toIso8601String(),
                'meta' => [
                    'task_id' => $progress->task_id,
                    'task_code' => $progress->task?->code,
                ],
            ]);
        }

        return $events;
    }

    protected function assignmentTypeFor(Task $task, User $user): string
    {
        if ((int) $task->assigned_user_id === (int) $user->id) {
            return 'direct';
        }

        if (filled($task->staff_position)) {
            return 'position';
        }

        return 'all_staff';
    }

    protected function progressOccurredAt(?UserTaskProgress $progress): ?Carbon
    {
        if ($progress === null) {
            return null;
        }

        $candidates = array_filter([
            $progress->claimed_at,
            $progress->failed_at,
            $progress->confirmed_at,
            $progress->verified_at,
            $progress->updated_at,
        ]);

        if ($candidates === []) {
            return null;
        }

        return collect($candidates)->sortDesc()->first();
    }

    protected function activityTitle(string $event): string
    {
        return match ($event) {
            'staff.position_assigned' => 'Staff position assigned',
            'staff.position_updated' => 'Staff position updated',
            'staff.position_removed' => 'Staff position removed',
            'staff.status_updated' => 'Staff status updated',
            'task.staff_assigned' => 'Task assigned',
            'task.staff_unassigned' => 'Task unassigned',
            default => str_replace(['.', '_'], [' ', ' '], $event),
        };
    }

    protected function calculatePerformanceScore(
        int $totalPoints,
        int $referrals,
        int $completedTasks,
        int $failedTasks,
        int $streakDays,
    ): int {
        $raw = ($totalPoints / 100)
            + ($referrals * 25)
            + ($completedTasks * 10)
            + ($streakDays * 5)
            - ($failedTasks * 3);

        return (int) max(0, round($raw));
    }

    protected function staffRankForUser(User $user, int $performanceScore): int
    {
        $higherRanked = User::query()
            ->where('is_staff', true)
            ->where('staff_status', 'active')
            ->where(function ($query) use ($user): void {
                $query->where('total_points', '>', $user->total_points)
                    ->orWhere(function ($query) use ($user): void {
                        $query->where('total_points', $user->total_points)
                            ->where('id', '<', $user->id);
                    });
            })
            ->count();

        return $higherRanked + 1;
    }

    protected function resolveLastActiveAt(User $user): ?Carbon
    {
        $lastClaim = DailyClaim::query()
            ->where('user_id', $user->id)
            ->max('claimed_at');

        $lastTask = UserTaskProgress::query()
            ->where('user_id', $user->id)
            ->max('updated_at');

        $candidates = array_filter([
            $user->last_login_at,
            $lastClaim ? Carbon::parse($lastClaim) : null,
            $lastTask ? Carbon::parse($lastTask) : null,
        ]);

        if ($candidates === []) {
            return null;
        }

        return collect($candidates)->sortDesc()->first();
    }
}
