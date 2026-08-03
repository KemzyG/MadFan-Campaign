<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminUserResource extends JsonResource
{
    /**
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
            'loyalty_tier_id' => $this->loyalty_tier_id,
            'total_points' => $this->total_points,
            'current_streak_days' => $this->current_streak_days,
            'best_streak_days' => $this->best_streak_days,
            'referral_count' => $this->referral_count,
            'is_staff' => (bool) $this->is_staff,
            'staff_position' => $this->staff_position,
            'staff_status' => $this->staff_status,
            'staff_position_assigned_at' => $this->staff_position_assigned_at,
            'email_verified_at' => $this->email_verified_at,
            'last_login_at' => $this->last_login_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'loyalty_tier' => $this->whenLoaded('loyaltyTier'),
            'roles' => $this->whenLoaded('roles'),
            'staff_position_assigned_by' => $this->whenLoaded('staffPositionAssignedBy'),
            'point_transactions' => $this->whenLoaded('pointTransactions'),
            'user_task_progress' => $this->whenLoaded('userTaskProgress'),
            'streak' => $this->whenLoaded('streak'),
            'referrals' => $this->whenLoaded('referrals'),
            'assigned_staff_tasks' => $this->whenLoaded('assignedStaffTasks'),
        ];
    }
}
