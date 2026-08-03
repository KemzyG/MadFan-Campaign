<?php

namespace App\Http\Controllers\Inertia;

use App\Http\Controllers\Controller;
use App\Models\LoyaltyTier;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class LoyaltyTiersPageController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('manageLoyaltyTiers');

        $tiers = LoyaltyTier::query()
            ->withCount('users')
            ->with('tierRewards')
            ->orderBy('display_order')
            ->get();

        return Inertia::render('Admin/LoyaltyTiers/Index', [
            'tiers' => $tiers,
        ]);
    }
}
