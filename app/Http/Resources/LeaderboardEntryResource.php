<?php

namespace App\Http\Resources;

use App\Support\MaskedEmail;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeaderboardEntryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $isSelf = $request->user()?->id === $this->id;

        return [
            'rank' => $this->rank,
            'points' => $this->total_points,
            'user' => [
                'id' => $this->id,
                // Public board uses masked email only; full name stays private except for the viewer themselves.
                'name' => $isSelf ? $this->name : null,
                'email_masked' => MaskedEmail::from($this->email),
                'username' => $isSelf ? $this->username : null,
                'fan_id' => $this->fan_id,
                'handle' => $isSelf ? $this->handle : null,
                'club' => $this->club,
                'avatar_emoji' => $this->avatar_emoji,
                'current_streak_days' => $this->current_streak_days,
                'loyalty_tier' => $this->loyaltyTier ? [
                    'code' => $this->loyaltyTier->code,
                    'name' => $this->loyaltyTier->name,
                ] : null,
            ],
        ];
    }
}
