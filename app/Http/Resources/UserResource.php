<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'name' => $this->name,
            'email' => $this->email,
            'username' => $this->username,
            'handle' => $this->handle,
            'fan_id' => $this->fan_id,
            'country' => $this->country,
            'league' => $this->league,
            'club' => $this->club,
            'avatar_emoji' => $this->avatar_emoji,
            'avatar_url' => $this->avatar_url,
            'has_custom_avatar' => $this->has_custom_avatar,
            'total_points' => $this->total_points,
            'current_streak_days' => $this->current_streak_days,
            'best_streak_days' => $this->best_streak_days,
            'referral_count' => $this->referral_count,
            'loyalty_tier' => $this->loyaltyTier ? [
                'id' => $this->loyaltyTier->id,
                'code' => $this->loyaltyTier->code,
                'name' => $this->loyaltyTier->name,
                'min_points' => $this->loyaltyTier->min_points,
                'max_points' => $this->loyaltyTier->max_points,
                'rewards' => $this->loyaltyTier->tierRewards->pluck('reward_text'),
            ] : null,
            'passport' => $this->relationLoaded('passport') && $this->passport ? [
                'qr_value' => $this->passport->qr_value,
                'referral_link' => $this->passport->referral_link,
                'share_slug' => $this->passport->share_slug,
                'is_public' => (bool) $this->passport->is_public,
            ] : null,
            'created_at' => $this->created_at,
        ];
    }
}
