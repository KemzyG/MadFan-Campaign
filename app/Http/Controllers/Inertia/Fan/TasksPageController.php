<?php

namespace App\Http\Controllers\Inertia\Fan;

use App\Http\Controllers\Controller;
use App\Http\Controllers\TaskController;
use App\Http\Requests\ClaimTaskRequest;
use App\Http\Requests\ConfirmTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Models\UserTaskProgress;
use App\Services\Fan\FanPageDataService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TasksPageController extends Controller
{
    public function index(Request $request, FanPageDataService $data): Response
    {
        return Inertia::render('Fan/Tasks', [
            ...$data->tasks($request),
            'fan' => $data->userHeader($request),
        ]);
    }

    /**
     * A single challenge's own page — reached from the Events feed, distinct
     * from the full /tasks list.
     */
    public function show(Request $request, Task $task, FanPageDataService $data): Response
    {
        $task->load('taskSteps');
        $task->userProgress = UserTaskProgress::where('user_id', $request->user()->id)
            ->where('task_id', $task->id)
            ->first();

        return Inertia::render('Fan/TaskShow', [
            'task' => TaskResource::make($task)->resolve($request),
            'fan' => $data->userHeader($request),
        ]);
    }

    public function confirm(ConfirmTaskRequest $request, Task $task): RedirectResponse
    {
        $response = app(TaskController::class)->confirm($request, $task);
        $payload = $response->getData(true);

        $message = is_array($payload) && ($payload['awaiting_review'] ?? false)
            ? 'Task submitted for admin review.'
            : 'Task confirmed. You can claim your points.';

        return back(fallback: route('fan.tasks'))->with('success', $message);
    }

    public function claim(ClaimTaskRequest $request, Task $task): RedirectResponse
    {
        app(TaskController::class)->claim($request, $task);

        return back(fallback: route('fan.tasks'))->with('success', 'Points claimed!');
    }

    public function complete(ConfirmTaskRequest $request, Task $task): RedirectResponse
    {
        $response = app(TaskController::class)->complete($request, $task);
        $payload = $response->getData(true);

        if (is_array($payload) && ($payload['awaiting_review'] ?? false)) {
            return back(fallback: route('fan.tasks'))->with('success', 'Task submitted for admin review. Points are awarded after approval.');
        }

        $points = is_array($payload) ? ($payload['points_awarded'] ?? $task->points) : $task->points;

        return back(fallback: route('fan.tasks'))->with('success', "You earned {$points} points!");
    }
}
