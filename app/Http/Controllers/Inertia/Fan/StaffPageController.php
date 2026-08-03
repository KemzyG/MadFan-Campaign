<?php

namespace App\Http\Controllers\Inertia\Fan;

use App\Http\Controllers\Controller;
use App\Models\Season;
use App\Models\Task;
use App\Models\UserTaskProgress;
use App\Services\Fan\FanPageDataService;
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
        protected FanPageDataService $fanPageData,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $season = Season::query()->where('status', 'active')->latest('starts_at')->first();

        $tasks = Task::query()
            ->with('taskSteps')
            ->where('is_active', true)
            ->when($season, fn ($query) => $query->where('season_id', $season->id))
            ->visibleToStaffUser($user)
            ->orderBy('display_order')
            ->get();

        $progressMap = UserTaskProgress::query()
            ->where('user_id', $user->id)
            ->whereIn('task_id', $tasks->pluck('id'))
            ->get()
            ->keyBy('task_id');

        $tasks->each(function (Task $task) use ($progressMap): void {
            $task->setAttribute('user_progress', $progressMap->get($task->id));
        });

        return Inertia::render('Fan/Staff', [
            'staff' => $this->staffAssignments->profileForUser($user),
            'performance' => $this->staffPerformance->forUser($user),
            'tasks' => $tasks->map(fn (Task $task): array => [
                'id' => $task->id,
                'code' => $task->code,
                'name' => $task->name,
                'description' => $task->description,
                'points' => $task->points,
                'task_type' => $task->task_type,
                'staff_position' => $task->staff_position,
                'steps' => $task->taskSteps,
                'user_progress' => $task->getAttribute('user_progress'),
            ])->values(),
            'fan' => $this->fanPageData->userHeader($request),
        ]);
    }
}
