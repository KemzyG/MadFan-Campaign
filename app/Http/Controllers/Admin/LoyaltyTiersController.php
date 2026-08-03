<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreLoyaltyTierRequest;
use App\Http\Requests\Admin\UpdateLoyaltyTierRequest;
use App\Models\ActivityLog;
use App\Models\LoyaltyTier;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class LoyaltyTiersController extends Controller
{
    public function index(): JsonResponse
    {
        Gate::authorize('manageLoyaltyTiers');
        $tiers = LoyaltyTier::withCount('users')
            ->with('tierRewards')
            ->orderBy('display_order')
            ->get();

        return response()->json($tiers);
    }

    public function show(LoyaltyTier $loyaltyTier): JsonResponse
    {
        Gate::authorize('manageLoyaltyTiers');

        return response()->json($loyaltyTier->load('tierRewards', 'users:id,name,email,total_points'));
    }

    public function store(StoreLoyaltyTierRequest $request): JsonResponse
    {
        Gate::authorize('manageLoyaltyTiers');
        $data = $request->validated();
        $data['display_order'] ??= (int) LoyaltyTier::query()->max('display_order') + 1;

        $tier = LoyaltyTier::create($data);

        ActivityLog::record('loyalty_tier.created', "Created tier {$tier->name}");

        return response()->json($tier, 201);
    }

    public function update(UpdateLoyaltyTierRequest $request, LoyaltyTier $loyaltyTier): JsonResponse
    {
        Gate::authorize('manageLoyaltyTiers');
        $loyaltyTier->update($request->validated());

        ActivityLog::record('loyalty_tier.updated', "Updated tier {$loyaltyTier->name}");

        return response()->json($loyaltyTier->fresh());
    }

    public function destroy(LoyaltyTier $loyaltyTier): JsonResponse
    {
        Gate::authorize('manageLoyaltyTiers');
        ActivityLog::record('loyalty_tier.deleted', "Deleted tier {$loyaltyTier->name}");
        $loyaltyTier->delete();

        return response()->json(['message' => 'Tier deleted.']);
    }
}
