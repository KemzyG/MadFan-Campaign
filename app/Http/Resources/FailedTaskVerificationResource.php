<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FailedTaskVerificationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'verification_status' => $this->verification_status,
            'external_handle' => $this->external_handle,
            'proof_url' => $this->proof_url,
            'failure_reason' => $this->failure_reason,
            'failed_at' => $this->failed_at,
            'confirmed_at' => $this->confirmed_at,
            'created_at' => $this->created_at,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'fan_id' => $this->user->fan_id,
                'handle' => $this->user->handle,
            ]),
            'task' => $this->whenLoaded('task', fn () => [
                'id' => $this->task->id,
                'code' => $this->task->code,
                'name' => $this->task->name,
                'platform' => $this->task->platform,
                'points' => $this->task->points,
            ]),
        ];
    }
}
