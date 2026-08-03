<?php

namespace App\Http\Controllers\Inertia;

use App\Actions\ReviewTaskSubmission;
use App\Enums\AdminPermission;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReviewTaskSubmissionRequest;
use App\Http\Resources\TaskReviewResource;
use App\Models\Task;
use App\Models\UserTaskProgress;
use App\Services\Admin\AdminOrganizationContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TaskReviewsPageController extends Controller
{
    public function __construct(private AdminOrganizationContext $organizationContext) {}

    public function index(Request $request): Response
    {
        Gate::authorize(AdminPermission::UsersView->value);

        $status = $request->string('status')->toString() ?: 'pending';
        $fanScope = fn ($query) => $this->organizationContext->applyFanScope($query);

        $query = UserTaskProgress::query()
            ->with([
                'user:id,name,email,fan_id,handle',
                'user.socialAccounts:id,user_id,platform,platform_user_id,username,display_name,connected_at,verified_at',
                'task:id,code,name,description,platform,task_type,points,external_url,verification_required',
                'task.taskSteps:id,task_id,step_number,description,link_url,link_label',
            ])
            ->whereHas('user', $fanScope)
            ->when($status === 'pending', fn ($query) => $query->awaitingReview())
            ->when($status === 'rejected', fn ($query) => $query->failedVerification())
            ->when($status === 'all', function ($query): void {
                $query->where(function ($query): void {
                    $query->awaitingReview()
                        ->orWhere(fn ($query) => $query->failedVerification());
                });
            })
            ->when($request->search, function ($query) use ($request): void {
                $search = (string) $request->search;
                $query->where(function ($query) use ($search): void {
                    $query->where('external_handle', 'like', "%{$search}%")
                        ->orWhere('proof_url', 'like', "%{$search}%")
                        ->orWhere('failure_reason', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($userQuery) => $userQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('fan_id', 'like', "%{$search}%")
                            ->orWhere('handle', 'like', "%{$search}%"))
                        ->orWhereHas('task', fn ($taskQuery) => $taskQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%"));
                });
            })
            ->when($request->platform, fn ($query) => $query->whereHas(
                'task',
                fn ($taskQuery) => $taskQuery->where('platform', $request->platform),
            ))
            ->when($request->task_id, fn ($query) => $query->where('task_id', $request->task_id))
            ->orderByDesc('confirmed_at')
            ->orderByDesc('updated_at');

        $reviews = $query
            ->paginate($request->integer('per_page', 20))
            ->withQueryString()
            ->through(fn (UserTaskProgress $progress) => (new TaskReviewResource($progress))->resolve());

        return Inertia::render('Admin/TaskReviews/Index', [
            'reviews' => $reviews,
            'pending_count' => UserTaskProgress::query()->whereHas('user', $fanScope)->awaitingReview()->count(),
            'rejected_count' => UserTaskProgress::query()->whereHas('user', $fanScope)->failedVerification()->count(),
            'filters' => array_merge(
                $request->only(['search', 'platform', 'task_id']),
                ['status' => $status],
            ),
            'platforms' => ['x', 'twitter', 'discord', 'telegram', 'general'],
            'tasks' => Task::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
        ]);
    }

    public function approve(Request $request, UserTaskProgress $progress, ReviewTaskSubmission $review): RedirectResponse
    {
        Gate::authorize(AdminPermission::UsersView->value);
        $this->ensureProgressVisible($progress);

        $result = $review->approve($progress, $request->user());

        return redirect()
            ->back()
            ->with('success', $result['message']);
    }

    public function reject(
        ReviewTaskSubmissionRequest $request,
        UserTaskProgress $progress,
        ReviewTaskSubmission $review,
    ): RedirectResponse {
        Gate::authorize(AdminPermission::UsersView->value);
        $this->ensureProgressVisible($progress);

        $result = $review->reject(
            $progress,
            $request->string('reason')->toString(),
            $request->user(),
        );

        return redirect()
            ->back()
            ->with('success', $result['message']);
    }

    private function ensureProgressVisible(UserTaskProgress $progress): void
    {
        $progress->loadMissing('user');

        abort_unless(
            $progress->user !== null
            && $this->organizationContext->fanIsVisible($progress->user),
            403,
        );
    }
}
