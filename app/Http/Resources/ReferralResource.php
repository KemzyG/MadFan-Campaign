<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReferralResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'referred_user_handle' => $this->referred_user_handle,
            'referred_email' => $this->referred_email,
            'status' => $this->status,
            'points_awarded' => $this->points_awarded,
            'activated_at' => $this->activated_at,
            'rewarded_at' => $this->rewarded_at,
        ];
    }
}
