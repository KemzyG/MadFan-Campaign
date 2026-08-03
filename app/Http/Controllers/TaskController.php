<?php

namespace App\Http\Controllers;

use App\Http\Requests\ClaimTaskRequest;
use App\Http\Requests\ConfirmTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\PointTransaction;
use App\Models\Season;
use App\Models\Task;
use App\Models\UserTaskProgress;
use App\Models\WeeklyProgress;
use App\Services\SocialVerificationService;
use App\Support\ApplicationSettings;
use App\Support\TaskProofStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TaskController extends Controller
{
    public function __construct(
        protected SocialVerificationService $socialVerification,
    ) {}

    /**
     * List all active tasks with steps and the authenticated user's progress.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $season = Season::where('status', 'active')->latest('starts_at')->first();

        $tasks = Task::with('taskSteps')
            ->forFans()
            ->where('is_active', true)
            ->when($season, fn ($q) => $q->where('season_id', $season->id))
            ->orderBy('display_order')
            ->get();

        // Load the user's progress for each task
        $userProgressMap = UserTaskProgress::where('user_id', $user->id)
            ->whereIn('task_id', $tasks->pluck('id'))
            ->get()
            ->keyBy('task_id');

        $tasks->each(function (Task $task) use ($userProgressMap): void {
            $task->userProgress = $userProgressMap->get($task->id);
        });

        // Weekly progress summary
        $weeklyProgress = null;
        if ($season) {
            $activeWeek = $season->seasonWeeks()->where('is_active', true)->first();
            if ($activeWeek) {
                $weeklyProgress = WeeklyProgress::firstOrCreate(
                    ['user_id' => $user->id, 'season_week_id' => $activeWeek->id],
                    [
                        'season_id' => $season->id,
                        'tasks_done' => 0,
                        'tasks_total' => $tasks->count(),
                        'completion_bonus_awarded' => false,
                        'completion_bonus_points' => $activeWeek->completion_bonus_points,
                    ]
                );
            }
        }

        return response()->json([
            'tasks' => TaskResource::collection($tasks),
            'weekly_progress' => $weeklyProgress ? [
                'tasks_done' => $weeklyProgress->tasks_done,
                'tasks_total' => $weeklyProgress->tasks_total,
                'completion_bonus_awarded' => $weeklyProgress->completion_bonus_awarded,
                'completion_bonus_points' => $weeklyProgress->completion_bonus_points,
                'progress_percentage' => $weeklyProgress->tasks_total > 0
                    ? round(($weeklyProgress->tasks_done / $weeklyProgress->tasks_total) * 100, 2)
                    : 0,
            ] : null,
        ]);
    }

    /**
     * Submit proof/confirmation for a task before claiming.
     */
    public function confirm(ConfirmTaskRequest $request, Task $task): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        $progress = UserTaskProgress::firstOrCreate(
            ['user_id' => $user->id, 'task_id' => $task->id],
            ['status' => 'pending', 'verification_status' => $task->verification_required ? 'pending' : 'not_required']
        );

        if ($progress->status === 'claimed') {
            return response()->json(['message' => 'Task already claimed.'], 409);
        }

        if ($progress->status === 'confirmed' && $progress->verification_status === 'pending') {
            return response()->json([
                'message' => 'Task is already awaiting admin review.',
                'status' => $progress->status,
                'verification_status' => $progress->verification_status,
                'awaiting_review' => true,
            ], 409);
        }

        if ($progress->status === 'confirmed' && $progress->verification_status === 'verified') {
            return response()->json(['message' => 'Task already confirmed or claimed.'], 409);
        }

        $verificationStatus = 'verified';
        $verifiedAt = now();
        $failedAt = null;
        $failureReason = null;
        $resolvedHandle = $this->socialVerification->resolveIdentifier($user, $task, $data);
        $awaitingManualReview = false;

        // Live social API verification (optional / legacy).
        if ($task->verification_required && ApplicationSettings::taskSocialVerificationEnabled()) {
            if ($this->socialVerification->requiresSocialConnection($task)
                && empty($resolvedHandle)
                && $this->socialVerification->platformForTask($task) !== null) {
                $platform = $this->socialVerification->platformForTask($task)?->value ?? 'social';

                throw ValidationException::withMessages([
                    'external_handle' => ["Connect your {$platform} account before completing this task."],
                ]);
            }

            if (empty($resolvedHandle)) {
                throw ValidationException::withMessages([
                    'external_handle' => ['An external handle or profile ID is required for verification.'],
                ]);
            }

            $verified = $this->socialVerification->verify($task, $resolvedHandle);
            $failureReason = $this->socialVerification->failureMessage($task);

            if ($verified) {
                $verificationStatus = 'verified';
                $verifiedAt = now();
            } else {
                $verificationStatus = 'failed';
                $verifiedAt = null;
                $failedAt = now();

                $progress->update([
                    'is_checked' => true,
                    'proof_url' => $data['proof_url'] ?? $progress->proof_url,
                    'proof_image_path' => $this->storeProofImage($request, $progress) ?? $progress->proof_image_path,
                    'external_handle' => $resolvedHandle,
                    'status' => 'pending',
                    'verification_status' => 'failed',
                    'failed_at' => $failedAt,
                    'failure_reason' => $failureReason,
                ]);

                throw ValidationException::withMessages([
                    'external_handle' => [$failureReason],
                ]);
            }
        } elseif ($task->verification_required) {
            // Default: admin manual review queue (no social connect required).
            $verificationStatus = 'pending';
            $verifiedAt = null;
            $awaitingManualReview = true;
        }

        $progress->update([
            'is_checked' => true,
            'proof_url' => $data['proof_url'] ?? $progress->proof_url,
            'proof_image_path' => $this->storeProofImage($request, $progress) ?? $progress->proof_image_path,
            'external_handle' => $resolvedHandle,
            'external_post_id' => $data['external_post_id'] ?? $progress->external_post_id,
            'verification_payload' => $data['verification_payload'] ?? $progress->verification_payload,
            'status' => 'confirmed',
            'confirmed_at' => now(),
            'verification_status' => $verificationStatus,
            'verified_at' => $verifiedAt,
            'failed_at' => null,
            'failure_reason' => null,
        ]);

        return response()->json([
            'message' => $awaitingManualReview
                ? 'Task submitted for admin review. Points will be awarded after approval.'
                : ($task->verification_required
                    ? 'Task confirmed and verified successfully. You may now claim your points.'
                    : 'Task confirmed and verified. You may now claim your points.'),
            'status' => $progress->status,
            'verification_status' => $progress->verification_status,
            'awaiting_review' => $awaitingManualReview,
        ]);
    }

    /**
     * Confirm and claim a task in one step (used by the fan web UI).
     */
    public function complete(ConfirmTaskRequest $request, Task $task): JsonResponse
    {
        $user = $request->user();

        $progress = UserTaskProgress::where('user_id', $user->id)
            ->where('task_id', $task->id)
            ->first();

        if ($progress?->status === 'claimed') {
            return response()->json(['message' => 'Task already claimed.'], 409);
        }

        if ($progress?->status !== 'confirmed') {
            $this->confirm($request, $task);
            $progress = UserTaskProgress::where('user_id', $user->id)
                ->where('task_id', $task->id)
                ->first();
        }

        if ($task->verification_required
            && $progress
            && $progress->verification_status === 'pending') {
            return response()->json([
                'message' => 'Task submitted for admin review. Points will be awarded after approval.',
                'status' => $progress->status,
                'verification_status' => 'pending',
                'awaiting_review' => true,
                'points_awarded' => 0,
            ]);
        }

        /** @var ClaimTaskRequest $claimRequest */
        $claimRequest = ClaimTaskRequest::createFrom($request);
        $claimRequest->setContainer(app());
        $claimRequest->validateResolved();

        $response = $this->claim($claimRequest, $task);

        if ($response->getStatusCode() >= 400) {
            $payload = $response->getData(true);
            $message = is_array($payload) ? ($payload['message'] ?? 'Unable to claim task.') : 'Unable to claim task.';

            throw ValidationException::withMessages([
                'task' => [$message],
            ]);
        }

        return $response;
    }

    /**
     * Claim points for a completed (and optionally verified) task.
     */
    public function claim(ClaimTaskRequest $request, Task $task): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        $progress = UserTaskProgress::where('user_id', $user->id)
            ->where('task_id', $task->id)
            ->first();

        if (! $progress || ! in_array($progress->status, ['confirmed'])) {
            return response()->json(['message' => 'Task must be confirmed before claiming.'], 422);
        }

        if ($progress->status === 'claimed') {
            return response()->json(['message' => 'Task already claimed.'], 409);
        }

        if ($task->verification_required && $progress->verification_status !== 'verified') {
            return response()->json([
                'message' => $progress->verification_status === 'pending'
                    ? 'This task is awaiting admin review.'
                    : 'Task verification is still pending.',
            ], 422);
        }

        $idempotencyKey = $data['idempotency_key']
            ?? 'task-claim-'.$user->id.'-'.$task->id;

        // Idempotency check
        if (PointTransaction::where('idempotency_key', $idempotencyKey)->exists()) {
            return response()->json(['message' => 'Task already claimed (duplicate request).'], 409);
        }

        return DB::transaction(function () use ($user, $task, $progress, $idempotencyKey) {
            $newBalance = $user->total_points + $task->points;

            $transaction = PointTransaction::create([
                'user_id' => $user->id,
                'season_id' => $task->season_id,
                'source_type' => 'task',
                'source_id' => (string) $task->id,
                'amount' => $task->points,
                'balance_after' => $newBalance,
                'reason' => "Task claimed: {$task->name}",
                'idempotency_key' => $idempotencyKey,
            ]);

            $progress->update([
                'status' => 'claimed',
                'claimed_at' => now(),
                'points_awarded' => $task->points,
                'point_transaction_id' => $transaction->id,
            ]);

            $user->increment('total_points', $task->points);

            // Update weekly progress
            $season = Season::where('status', 'active')->latest('starts_at')->first();
            if ($season) {
                $activeWeek = $season->seasonWeeks()->where('is_active', true)->first();
                if ($activeWeek) {
                    $weeklyProgress = WeeklyProgress::firstOrCreate(
                        ['user_id' => $user->id, 'season_week_id' => $activeWeek->id],
                        [
                            'season_id' => $season->id,
                            'tasks_done' => 0,
                            'tasks_total' => Task::where('season_id', $season->id)->where('is_active', true)->count(),
                            'completion_bonus_awarded' => false,
                            'completion_bonus_points' => $activeWeek->completion_bonus_points,
                        ]
                    );
                    $weeklyProgress->increment('tasks_done');

                    // Award completion bonus if all done
                    $weeklyProgress->refresh();
                    if (
                        ! $weeklyProgress->completion_bonus_awarded
                        && $weeklyProgress->tasks_done >= $weeklyProgress->tasks_total
                    ) {
                        $bonusPoints = $activeWeek->completion_bonus_points;
                        $bonusBalance = $user->fresh()->total_points + $bonusPoints;
                        $bonusTx = PointTransaction::create([
                            'user_id' => $user->id,
                            'season_id' => $season->id,
                            'source_type' => 'bonus',
                            'source_id' => (string) $activeWeek->id,
                            'amount' => $bonusPoints,
                            'balance_after' => $bonusBalance,
                            'reason' => 'Weekly completion bonus',
                            'idempotency_key' => 'week-bonus-'.$user->id.'-'.$activeWeek->id,
                        ]);
                        $weeklyProgress->update([
                            'completion_bonus_awarded' => true,
                            'completion_bonus_transaction_id' => $bonusTx->id,
                        ]);
                        $user->increment('total_points', $bonusPoints);
                    }
                }
            }

            return response()->json([
                'message' => 'Task claimed successfully!',
                'points_awarded' => $task->points,
                'new_total_points' => $user->fresh()->total_points,
            ]);
        });
    }

    /**
     * Store a new proof screenshot on the public disk, replacing any previous image.
     */
    protected function storeProofImage(ConfirmTaskRequest $request, UserTaskProgress $progress): ?string
    {
        if (! $request->hasFile('proof_image')) {
            return null;
        }

        $path = TaskProofStorage::store($request->file('proof_image'), $request->user()->id);

        if (filled($progress->proof_image_path) && $progress->proof_image_path !== $path) {
            TaskProofStorage::delete($progress->proof_image_path);
        }

        return $path;
    }
}
