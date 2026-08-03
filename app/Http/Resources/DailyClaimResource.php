<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DailyClaimResource extends JsonResource
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
            'claim_date' => $this->claim_date?->toDateString(),
            'status' => $this->status,
            'base_points' => $this->base_points,
            'multiplier' => $this->multiplier,
            'points_earned' => $this->points_earned,
            'streak_day_number' => $this->streak_day_number,
            'claimed_at' => $this->claimed_at,
        ];
    }
}
