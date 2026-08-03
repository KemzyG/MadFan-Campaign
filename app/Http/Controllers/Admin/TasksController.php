<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreTaskRequest;
use App\Http\Requests\Admin\UpdateTaskRequest;
use App\Models\ActivityLog;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TasksController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Task::class);
        $query = Task::with('season', 'seasonWeek', 'taskSteps')
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->when($request->season_id, fn ($q) => $q->where('season_id', $request->season_id))
            ->when($request->is_active !== null, fn ($q) => $q->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN)))
            ->orderBy('display_order');

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    public function show(Task $task): JsonResponse
    {
        $this->authorize('view', $task);

        return response()->json($task->load('season', 'seasonWeek', 'taskSteps'));
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $this->authorize('create', Task::class);
        $data = array_merge([
            'description' => '',
            'platform' => 'internal',
            'task_type' => 'general',
            'display_order' => (int) Task::query()->max('display_order') + 1,
            'audience' => 'fan',
        ], $request->validated());

        $task = Task::create($data);

        if ($request->has('steps')) {
            foreach ($request->steps as $order => $step) {
                $task->taskSteps()->create([...$step, 'step_number' => $order + 1]);
            }
        }

        ActivityLog::record('task.created', "Created task {$task->name}");
        $this->logStaffAssignmentChange($task, null);

        return response()->json($task->load('taskSteps'), 201);
    }

    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task);
        $previousAssignedUserId = $task->assigned_user_id;
        $task->update($request->validated());

        if ($request->has('steps')) {
            $task->taskSteps()->delete();
            foreach ($request->steps as $order => $step) {
                $task->taskSteps()->create([...$step, 'step_number' => $order + 1]);
            }
        }

        ActivityLog::record('task.updated', "Updated task {$task->name}");
        $this->logStaffAssignmentChange($task->fresh(), $previousAssignedUserId);

        return response()->json($task->load('taskSteps'));
    }

    public function destroy(Task $task): JsonResponse
    {
        $this->authorize('delete', $task);
        ActivityLog::record('task.deleted', "Deleted task {$task->name}");
        $task->delete();

        return response()->json(['message' => 'Task deleted.']);
    }

    private function logStaffAssignmentChange(Task $task, ?int $previousAssignedUserId): void
    {
        if ($task->audience !== 'staff') {
            return;
        }

        $currentAssignedUserId = $task->assigned_user_id !== null ? (int) $task->assigned_user_id : null;
        $previousAssignedUserId = $previousAssignedUserId !== null ? (int) $previousAssignedUserId : null;

        if ($currentAssignedUserId === $previousAssignedUserId) {
            if ($currentAssignedUserId === null && $previousAssignedUserId === null && $task->wasRecentlyCreated) {
                ActivityLog::record(
                    'task.staff_assigned',
                    filled($task->staff_position)
                        ? "Assigned staff task {$task->code} to position {$task->staff_position}"
                        : "Created open staff task {$task->code}",
                    auth()->id(),
                    [
                        'task_id' => $task->id,
                        'task_code' => $task->code,
                        'staff_position' => $task->staff_position,
                        'assigned_user_id' => null,
                    ],
                );
            }

            return;
        }

        if ($previousAssignedUserId !== null && $previousAssignedUserId !== $currentAssignedUserId) {
            ActivityLog::record(
                'task.staff_unassigned',
                "Unassigned staff task {$task->code} from user #{$previousAssignedUserId}",
                auth()->id(),
                [
                    'task_id' => $task->id,
                    'task_code' => $task->code,
                    'assigned_user_id' => $previousAssignedUserId,
                ],
            );
        }

        if ($currentAssignedUserId !== null) {
            ActivityLog::record(
                'task.staff_assigned',
                "Assigned staff task {$task->code} to user #{$currentAssignedUserId}",
                auth()->id(),
                [
                    'task_id' => $task->id,
                    'task_code' => $task->code,
                    'staff_position' => $task->staff_position,
                    'assigned_user_id' => $currentAssignedUserId,
                ],
            );
        }
    }
}
