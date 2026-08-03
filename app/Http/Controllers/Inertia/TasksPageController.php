<?php

namespace App\Http\Controllers\Inertia;

use App\Enums\StaffPosition;
use App\Enums\TaskAudience;
use App\Http\Controllers\Controller;
use App\Models\Season;
use App\Models\Task;
use App\Models\User;
use App\Models\UserTaskProgress;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TasksPageController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Task::class);

        $tasks = Task::query()
            ->with('season:id,name,code', 'seasonWeek:id,week_number', 'taskSteps')
            ->when($request->search, fn ($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->when($request->season_id, fn ($q) => $q->where('season_id', $request->season_id))
            ->when($request->filled('is_active'), fn ($q) => $q->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN)))
            ->orderBy('display_order')
            ->paginate($request->per_page ?? 20)
            ->withQueryString();

        return Inertia::render('Admin/Tasks/Index', [
            'tasks' => $tasks,
            'pending_review_count' => UserTaskProgress::query()->awaitingReview()->count(),
            'failed_verification_count' => UserTaskProgress::query()->failedVerification()->count(),
            'filters' => $request->only(['search', 'season_id', 'is_active']),
            'seasons' => Season::query()->orderByDesc('starts_at')->get(['id', 'name', 'code']),
            'platforms' => ['internal', 'x', 'twitter', 'discord', 'telegram', 'general'],
            'taskTypes' => ['general', 'social', 'referral', 'profile', 'engagement', 'staff'],
            'staffPositions' => StaffPosition::options(),
            'audiences' => array_map(
                fn (TaskAudience $audience): array => [
                    'value' => $audience->value,
                    'label' => $audience->label(),
                ],
                TaskAudience::cases(),
            ),
            'staffMembers' => User::query()
                ->where('is_staff', true)
                ->where('staff_status', 'active')
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'fan_id', 'staff_position']),
        ]);
    }
}
