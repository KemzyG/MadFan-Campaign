<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StaffPosition;
use App\Enums\StaffStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AssignStaffPositionRequest;
use App\Models\User;
use App\Services\Staff\StaffAssignmentService;
use App\Services\Staff\StaffPerformanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffAssignmentsController extends Controller
{
    public function __construct(
        protected StaffAssignmentService $staffAssignments,
        protected StaffPerformanceService $staffPerformance,
    ) {}

    public function positions(): JsonResponse
    {
        $this->authorize('viewAnyStaff', User::class);

        return response()->json([
            'positions' => StaffPosition::options(),
            'statuses' => array_map(
                fn (StaffStatus $status): array => [
                    'value' => $status->value,
                    'label' => $status->label(),
                ],
                StaffStatus::cases(),
            ),
        ]);
    }

    public function assign(AssignStaffPositionRequest $request, User $user): JsonResponse
    {
        $this->authorize('manageStaff', $user);
        $position = StaffPosition::from($request->validated('staff_position'));
        $status = $request->filled('staff_status')
            ? StaffStatus::from($request->validated('staff_status'))
            : StaffStatus::Active;

        $updated = $this->staffAssignments->assign($user, $position, $request->user(), $status);

        return response()->json([
            'message' => 'Staff position assigned.',
            'user' => $updated->load('staffPositionAssignedBy'),
            'staff' => $this->staffAssignments->profileForUser($updated),
            'performance' => $this->staffPerformance->forUser($updated),
        ]);
    }

    public function update(AssignStaffPositionRequest $request, User $user): JsonResponse
    {
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
            'message' => 'Staff position updated.',
            'user' => $updated->load('staffPositionAssignedBy'),
            'staff' => $this->staffAssignments->profileForUser($updated),
            'performance' => $this->staffPerformance->forUser($updated),
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorize('manageStaff', $user);
        $updated = $this->staffAssignments->remove($user, $request->user());

        return response()->json([
            'message' => 'Staff position removed.',
            'user' => $updated,
        ]);
    }

    public function performance(User $user): JsonResponse
    {
        $this->authorize('viewAnyStaff', User::class);

        return response()->json([
            'staff' => $this->staffAssignments->profileForUser($user),
            'performance' => $this->staffPerformance->forUser($user),
            'tracked_assignments' => $this->staffPerformance->trackedAssignments($user),
            'activity_timeline' => $this->staffPerformance->activityTimeline($user),
            'assigned_tasks' => $user->assignedStaffTasks()
                ->where('audience', 'staff')
                ->orderBy('display_order')
                ->get(['id', 'name', 'code', 'points', 'staff_position', 'is_active']),
            'leaderboard' => $this->staffPerformance->leaderboard(),
        ]);
    }
}
