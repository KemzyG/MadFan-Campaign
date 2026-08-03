<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskReviewResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $awaiting = $this->verification_status === 'pending' && $this->status === 'confirmed';
        $rejected = $this->verification_status === 'failed';

        return [
            'id' => $this->id,
            'status' => $this->status,
            'verification_status' => $this->verification_status,
            'awaiting_review' => $awaiting,
            'is_rejected' => $rejected,
            'external_handle' => $this->external_handle,
            'external_post_id' => $this->external_post_id,
            'proof_url' => $this->proof_url,
            'proof_image_url' => $this->proof_image_url,
            'has_proof' => $this->hasProof(),
            'failure_reason' => $this->failure_reason,
            'verification_payload' => $this->verification_payload,
            'confirmed_at' => $this->confirmed_at,
            'verified_at' => $this->verified_at,
            'failed_at' => $this->failed_at,
            'claimed_at' => $this->claimed_at,
            'updated_at' => $this->updated_at,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'fan_id' => $this->user->fan_id,
                'handle' => $this->user->handle,
                'social_accounts' => $this->when(
                    $this->user->relationLoaded('socialAccounts'),
                    fn () => $this->user->socialAccounts->map(fn ($account) => [
                        'platform' => $account->platform?->value ?? $account->platform,
                        'username' => $account->username,
                        'display_name' => $account->display_name,
                        'platform_user_id' => $account->platform_user_id,
                        'connected_at' => $account->connected_at,
                        'verified_at' => $account->verified_at,
                    ])->values()->all(),
                ),
            ]),
            'task' => $this->whenLoaded('task', fn () => [
                'id' => $this->task->id,
                'code' => $this->task->code,
                'name' => $this->task->name,
                'description' => $this->task->description,
                'platform' => $this->task->platform,
                'task_type' => $this->task->task_type,
                'points' => $this->task->points,
                'external_url' => $this->task->external_url,
                'verification_required' => (bool) $this->task->verification_required,
                'steps' => $this->when(
                    $this->task->relationLoaded('taskSteps'),
                    fn () => $this->task->taskSteps
                        ->sortBy('step_number')
                        ->values()
                        ->map(fn ($step) => [
                            'step_number' => $step->step_number,
                            'description' => $step->description,
                            'link_url' => $step->link_url,
                            'link_label' => $step->link_label,
                        ])->all(),
                ),
            ]),
        ];
    }
}
