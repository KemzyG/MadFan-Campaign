<?php

namespace App\Http\Controllers\Inertia;

use App\Enums\StaffPosition;
use App\Enums\StaffStatus;
use App\Enums\TaskAudience;
use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\User;
use App\Services\Admin\ImpersonationService;
use App\Services\Staff\StaffAssignmentService;
use App\Services\Staff\StaffPerformanceService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StaffPageController extends Controller
{
    public function __construct(
        protected StaffAssignmentService $staffAssignments,
        protected StaffPerformanceService $staffPerformance,
        protected ImpersonationService $impersonation,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAnyStaff', User::class);

        $staff = User::query()
            ->with('staffPositionAssignedBy:id,name,email')
            ->where('is_staff', true)
            ->when($request->staff_position, fn ($query) => $query->where('staff_position', $request->staff_position))
            ->when($request->staff_status, fn ($query) => $query->where('staff_status', $request->staff_status))
            ->when($request->search, fn ($query) => $query->where(function ($query) use ($request): void {
                $query->where('name', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%")
                    ->orWhere('fan_id', 'like', "%{$request->search}%")
                    ->orWhere('username', 'like', "%{$request->search}%");
            }))
            ->orderByDesc('staff_position_assigned_at')
            ->paginate($request->per_page ?? 20)
            ->withQueryString();

        $staff->getCollection()->transform(function (User $user): array {
            $performance = $this->staffPerformance->forUser($user);

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'fan_id' => $user->fan_id,
                'staff_position' => $user->staff_position,
                'staff_position_label' => StaffPosition::tryFrom((string) $user->staff_position)?->label(),
                'staff_status' => $user->staff_status,
                'staff_status_label' => StaffStatus::tryFrom((string) $user->staff_status)?->label(),
                'staff_position_assigned_at' => $user->staff_position_assigned_at?->toIso8601String(),
                'assigned_by_name' => $user->staffPositionAssignedBy?->name,
                'total_points' => $performance['total_points'],
                'total_referrals' => $performance['total_referrals'],
                'completed_tasks' => $performance['completed_tasks'],
                'performance_score' => $performance['performance_score'],
                'staff_rank' => $performance['staff_rank'],
            ];
        });

        return Inertia::render('Admin/Staff/Index', [
            'staff' => $staff,
            'filters' => $request->only(['search', 'staff_position', 'staff_status']),
            'staffPositions' => StaffPosition::options(),
            'staffStatuses' => array_map(
                fn (StaffStatus $status): array => [
                    'value' => $status->value,
                    'label' => $status->label(),
                ],
                StaffStatus::cases(),
            ),
        ]);
    }

    public function show(Request $request, User $user): Response
    {
        abort_unless($user->is_staff, 404);
        $this->authorize('viewAnyStaff', User::class);

        $user->load([
            'staffPositionAssignedBy:id,name,email',
            'assignedStaffTasks' => fn ($query) => $query
                ->where('audience', TaskAudience::Staff->value)
                ->orderBy('display_order'),
        ]);

        $positionTasks = Task::query()
            ->where('audience', TaskAudience::Staff->value)
            ->where('staff_position', $user->staff_position)
            ->whereNull('assigned_user_id')
            ->orderBy('display_order')
            ->get(['id', 'name', 'code', 'points', 'staff_position', 'is_active', 'task_type']);

        return Inertia::render('Admin/Staff/Show', [
            'member' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'fan_id' => $user->fan_id,
                'username' => $user->username,
            ],
            'staff_profile' => $this->staffAssignments->profileForUser($user),
            'performance' => $this->staffPerformance->forUser($user),
            'tracked_assignments' => $this->staffPerformance->trackedAssignments($user),
            'activity_timeline' => $this->staffPerformance->activityTimeline($user),
            'assigned_tasks' => $user->assignedStaffTasks,
            'position_tasks' => $positionTasks,
            'leaderboard' => $this->staffPerformance->leaderboard(),
            'staffPositions' => StaffPosition::options(),
            'staffStatuses' => array_map(
                fn (StaffStatus $status): array => [
                    'value' => $status->value,
                    'label' => $status->label(),
                ],
                StaffStatus::cases(),
            ),
            'can_impersonate' => $this->impersonation->canImpersonate($request->user(), $user),
        ]);
    }
}
