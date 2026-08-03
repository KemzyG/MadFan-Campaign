<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StaffPosition;
use App\Enums\StaffStatus;
use App\Enums\TaskAudience;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AssignStaffPositionRequest;
use App\Http\Requests\Admin\StoreStaffMemberRequest;
use App\Models\Task;
use App\Models\User;
use App\Services\Staff\StaffAssignmentService;
use App\Services\Staff\StaffPerformanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffMembersController extends Controller
{
    public function __construct(
        protected StaffAssignmentService $staffAssignments,
        protected StaffPerformanceService $staffPerformance,
    ) {}

    public function index(Request $request): JsonResponse
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
            ->paginate($request->per_page ?? 20);

        $staff->getCollection()->transform(fn (User $user): array => $this->summaryForUser($user));

        return response()->json($staff);
    }

    public function show(User $user): JsonResponse
    {
        $this->ensureStaffMember($user);
        $this->authorize('viewAnyStaff', User::class);

        return response()->json($this->detailForUser($user));
    }

    public function store(StoreStaffMemberRequest $request): JsonResponse
    {
        $this->authorize('manageStaff', User::query()->findOrFail($request->validated('user_id')));
        $user = User::query()->findOrFail($request->validated('user_id'));
        $position = StaffPosition::from($request->validated('staff_position'));
        $status = $request->filled('staff_status')
            ? StaffStatus::from($request->validated('staff_status'))
            : StaffStatus::Active;

        $updated = $this->staffAssignments->assign($user, $position, $request->user(), $status);

        return response()->json([
            'message' => 'Staff member created.',
            ...$this->detailForUser($updated),
        ], 201);
    }

    public function update(AssignStaffPositionRequest $request, User $user): JsonResponse
    {
        $this->ensureStaffMember($user);
        $this->authorize('manageStaff', $user);

        $position = StaffPosition::from($request->validated('staff_position'));

        $updated = $this->staffAssignments->updatePosition($user, $position, $request->user());

        if ($request->filled('staff_status')) {
            $updated = $this->staffAssignments->setStatus(
                $updated,
                StaffStatus::from($request->validated('staff_status')),
                $request->user(),
            );
        }

        return response()->json([
            'message' => 'Staff member updated.',
            ...$this->detailForUser($updated),
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->ensureStaffMember($user);
        $this->authorize('manageStaff', $user);

        $this->staffAssignments->remove($user, $request->user());

        return response()->json([
            'message' => 'Staff member removed.',
        ]);
    }

    protected function ensureStaffMember(User $user): void
    {
        abort_unless($user->is_staff, 404);
    }

    /**
     * @return array<string, mixed>
     */
    protected function summaryForUser(User $user): array
    {
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
            'assigned_by' => $user->staffPositionAssignedBy ? [
                'id' => $user->staffPositionAssignedBy->id,
                'name' => $user->staffPositionAssignedBy->name,
            ] : null,
            'total_points' => $performance['total_points'],
            'total_referrals' => $performance['total_referrals'],
            'completed_tasks' => $performance['completed_tasks'],
            'performance_score' => $performance['performance_score'],
            'staff_rank' => $performance['staff_rank'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function detailForUser(User $user): array
    {
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

        return [
            'user' => $user,
            'staff_profile' => $this->staffAssignments->profileForUser($user),
            'performance' => $this->staffPerformance->forUser($user),
            'tracked_assignments' => $this->staffPerformance->trackedAssignments($user),
            'activity_timeline' => $this->staffPerformance->activityTimeline($user),
            'assigned_tasks' => $user->assignedStaffTasks,
            'position_tasks' => $positionTasks,
            'leaderboard' => $this->staffPerformance->leaderboard(),
        ];
    }
}
