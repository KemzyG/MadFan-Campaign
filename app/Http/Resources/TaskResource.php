<?php

namespace App\Http\Resources;

use App\Support\TaskCompletionRules;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $userProgress = $this->userProgress ?? null;

        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'description' => $this->description,
            'points' => $this->points,
            'platform' => $this->platform,
            'task_type' => $this->task_type,
            'external_url' => $this->external_url,
            'verification_required' => (bool) $this->verification_required,
            'display_order' => $this->display_order,
            'completion_rules' => TaskCompletionRules::forTask($this->resource, $request->user()),
            'steps' => $this->relationLoaded('taskSteps')
                ? $this->taskSteps->map(fn ($s) => [
                    'step_number' => $s->step_number,
                    'description' => $s->description,
                    'link_url' => $s->link_url,
                    'link_label' => $s->link_label,
                ])
                : [],
            'user_progress' => $userProgress ? [
                'status' => $userProgress->status,
                'verification_status' => $userProgress->verification_status,
                'is_checked' => (bool) $userProgress->is_checked,
                'points_awarded' => $userProgress->points_awarded,
                'claimed_at' => $userProgress->claimed_at,
                'confirmed_at' => $userProgress->confirmed_at,
                'external_handle' => $userProgress->external_handle,
                'proof_url' => $userProgress->proof_url,
                'proof_image_url' => $userProgress->proof_image_url,
                'failure_reason' => $userProgress->failure_reason,
            ] : null,
        ];
    }
}
