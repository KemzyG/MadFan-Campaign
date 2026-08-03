<?php

namespace App\Http\Controllers;

use App\Http\Resources\ReferralResource;
use App\Models\PointTransaction;
use App\Models\Referral;
use App\Models\ReferralMilestone;
use App\Models\UserReferralMilestone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReferralController extends Controller
{
    /**
     * List referred fans, referral link, and milestone progress.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $referrals = Referral::where('referrer_user_id', $user->id)
            ->orderByDesc('created_at')
            ->get();

        $milestones = ReferralMilestone::orderBy('target_count')
            ->get()
            ->map(function (ReferralMilestone $milestone) use ($user) {
                $userMilestone = UserReferralMilestone::where('user_id', $user->id)
                    ->where('referral_milestone_id', $milestone->id)
                    ->first();

                return [
                    'id' => $milestone->id,
                    'target_count' => $milestone->target_count,
                    'reward_name' => $milestone->reward_name,
                    'reward_description' => $milestone->reward_description,
                    'bonus_points' => $milestone->bonus_points,
                    'status' => $userMilestone?->status ?? ($user->referral_count >= $milestone->target_count ? 'done' : 'locked'),
                    'progress_count' => $userMilestone?->progress_count ?? $user->referral_count,
                    'completed_at' => $userMilestone?->completed_at,
                    'claimable' => $user->referral_count >= $milestone->target_count && (! $userMilestone || $userMilestone->status !== 'done'),
                ];
            });

        $passport = $user->passport;

        return response()->json([
            'referral_link' => $passport?->referral_link ?? url('/r/'.$user->fan_id),
            'referral_count' => $user->referral_count,
            'referred_fans' => ReferralResource::collection($referrals),
            'milestones' => $milestones,
        ]);
    }

    /**
     * Claim a referral milestone reward once eligible.
     */
    public function claimMilestone(Request $request): JsonResponse
    {
        $data = $request->validate([
            'referral_milestone_id' => ['required', 'integer', 'exists:referral_milestones,id'],
        ]);

        $user = $request->user();
        $milestone = ReferralMilestone::findOrFail($data['referral_milestone_id']);

        if ($user->referral_count < $milestone->target_count) {
            return response()->json([
                'message' => "You need {$milestone->target_count} referrals to claim this milestone.",
            ], 422);
        }

        $userMilestone = UserReferralMilestone::where('user_id', $user->id)
            ->where('referral_milestone_id', $milestone->id)
            ->first();

        if ($userMilestone && $userMilestone->status === 'done') {
            return response()->json(['message' => 'Milestone already claimed.'], 409);
        }

        $idempotencyKey = 'referral-milestone-'.$user->id.'-'.$milestone->id;

        if (PointTransaction::where('idempotency_key', $idempotencyKey)->exists()) {
            return response()->json(['message' => 'Duplicate milestone claim request.'], 409);
        }

        return DB::transaction(function () use ($user, $milestone, $userMilestone, $idempotencyKey) {
            $bonusPoints = $milestone->bonus_points ?? 0;
            $newBalance = $user->total_points + $bonusPoints;

            $transaction = null;
            if ($bonusPoints > 0) {
                $transaction = PointTransaction::create([
                    'user_id' => $user->id,
                    'season_id' => $milestone->season_id,
                    'source_type' => 'referral',
                    'source_id' => (string) $milestone->id,
                    'amount' => $bonusPoints,
                    'balance_after' => $newBalance,
                    'reason' => "Referral milestone reward: {$milestone->reward_name}",
                    'idempotency_key' => $idempotencyKey,
                ]);

                $user->increment('total_points', $bonusPoints);
            }

            if ($userMilestone) {
                $userMilestone->update([
                    'status' => 'done',
                    'progress_count' => $user->referral_count,
                    'completed_at' => now(),
                    'point_transaction_id' => $transaction?->id,
                ]);
            } else {
                UserReferralMilestone::create([
                    'user_id' => $user->id,
                    'referral_milestone_id' => $milestone->id,
                    'status' => 'done',
                    'progress_count' => $user->referral_count,
                    'completed_at' => now(),
                    'point_transaction_id' => $transaction?->id,
                ]);
            }

            return response()->json([
                'message' => "Milestone '{$milestone->reward_name}' claimed successfully!",
                'bonus_points_awarded' => $bonusPoints,
                'new_total_points' => $user->fresh()->total_points,
            ]);
        });
    }
}
