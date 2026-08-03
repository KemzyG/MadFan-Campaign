<?php

namespace App\Services\Admin;

use App\Enums\AdminPermission;
use App\Enums\PointSourceType;
use App\Enums\StaffPosition;
use App\Models\ActivityLog;
use App\Models\PointTransaction;
use App\Models\Referral;
use App\Models\Task;
use App\Models\User;
use App\Services\Analytics\AnalyticsService;
use App\Services\Staff\StaffAssignmentService;
use App\Services\Staff\StaffPerformanceService;
use Illuminate\Support\Facades\DB;

class AdminDashboardDataService
{
    public function __construct(
        private AnalyticsService $analytics,
        private AdminOrganizationContext $organizationContext,
        private StaffPerformanceService $staffPerformance,
        private StaffAssignmentService $staffAssignments,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function dataFor(User $user): array
    {
        if ($user->can(AdminPermission::DashboardPlatform->value)) {
            return [
                'dashboard_mode' => 'platform',
                ...$this->platformData(),
            ];
        }

        return [
            'dashboard_mode' => 'personal',
            ...$this->personalData($user),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function data(): array
    {
        $user = $this->organizationContext->user() ?? auth()->user();

        if ($user instanceof User) {
            return $this->dataFor($user);
        }

        return [
            'dashboard_mode' => 'platform',
            ...$this->platformData(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function platformData(): array
    {
        $fanScope = function ($query) {
            // Service-level callers (no HTTP bootstrap) should still see fan accounts.
            if ($this->organizationContext->user() === null) {
                return $query->fanAccounts();
            }

            return $this->organizationContext->applyFanScope($query);
        };

        $signupTrend = $fanScope(User::query())
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as count'))
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $pointsTrend = PointTransaction::query()
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(amount) as total'))
            ->where('amount', '>', 0)
            ->where('created_at', '>=', now()->subDays(30))
            ->whereHas('user', $fanScope)
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $topUsers = $fanScope(User::query())
            ->select('id', 'name', 'username', 'email', 'total_points', 'fan_id')
            ->orderByDesc('total_points')
            ->limit(5)
            ->get();

        $recentActivity = ActivityLog::query()
            ->with('user:id,name,email')
            ->whereHas('user', $fanScope)
            ->latest()
            ->limit(10)
            ->get();

        return [
            'stats' => [
                'total_users' => $fanScope(User::query())->count(),
                'new_users_today' => $fanScope(User::query())->whereDate('created_at', today())->count(),
                'new_users_this_week' => $fanScope(User::query())
                    ->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])
                    ->count(),
                'total_points_distributed' => PointTransaction::query()
                    ->where('amount', '>', 0)
                    ->whereHas('user', $fanScope)
                    ->sum('amount'),
                'shootout_points_distributed' => PointTransaction::query()
                    ->where('amount', '>', 0)
                    ->where('source_type', PointSourceType::PenaltyShootout)
                    ->whereHas('user', $fanScope)
                    ->sum('amount'),
                'active_tasks' => Task::query()->where('is_active', true)->count(),
                'pending_referrals' => Referral::query()
                    ->where('status', 'pending')
                    ->whereHas('referrer', $fanScope)
                    ->count(),
                'daily_claims_today' => $this->analytics->dailyClaimsToday(),
                'task_completion_rate' => $this->analytics->taskCompletionRate(),
            ],
            'signup_trend' => $signupTrend,
            'points_trend' => $pointsTrend,
            'points_series' => $this->analytics->pointsAwardedSeries(14),
            'points_by_source' => $this->analytics->pointsBySource(30),
            'source_type_labels' => $this->analytics->sourceTypeLabels(),
            'daily_claims_series' => $this->analytics->dailyClaimsSeries(14),
            'top_users' => $topUsers,
            'recent_activity' => $recentActivity,
            'performance' => null,
            'tracked_assignments' => [],
            'activity_timeline' => [],
            'staff_profile' => null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function personalData(User $user): array
    {
        $performance = $this->staffPerformance->forUser($user);
        $position = StaffPosition::tryFrom((string) $user->staff_position);

        return [
            'stats' => [
                'total_points' => $performance['total_points'],
                'total_referrals' => $performance['total_referrals'],
                'completed_tasks' => $performance['completed_tasks'],
                'pending_tasks' => $performance['pending_tasks'],
                'failed_tasks' => $performance['failed_tasks'],
                'staff_completed_tasks' => $performance['staff_completed_tasks'],
                'staff_pending_tasks' => $performance['staff_pending_tasks'],
                'performance_score' => $performance['performance_score'],
                'staff_rank' => $performance['staff_rank'],
                'current_streak_days' => $performance['current_streak_days'],
                'best_streak_days' => $performance['best_streak_days'],
                'daily_claims_today' => $performance['daily_claims_today'],
                'weekly_claims' => $performance['weekly_claims'],
                'monthly_claims' => $performance['monthly_claims'],
            ],
            'signup_trend' => [],
            'points_trend' => [],
            'points_series' => ['labels' => [], 'values' => []],
            'points_by_source' => [],
            'source_type_labels' => [],
            'daily_claims_series' => ['labels' => [], 'values' => []],
            'top_users' => [],
            'recent_activity' => [],
            'performance' => $performance,
            'tracked_assignments' => $this->staffPerformance->trackedAssignments($user),
            'activity_timeline' => $this->staffPerformance->activityTimeline($user),
            'staff_profile' => [
                'name' => $user->name,
                'email' => $user->email,
                'fan_id' => $user->fan_id,
                'position' => $position?->value,
                'position_label' => $position?->label() ?? ($user->isActiveStaffMember() ? 'Staff' : 'Operator'),
                'is_active_staff' => $this->staffAssignments->isActiveStaff($user),
            ],
        ];
    }
}
