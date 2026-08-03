<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AdminPermission;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Referral;
use App\Services\Admin\AdminOrganizationContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ReferralsController extends Controller
{
    public function __construct(private AdminOrganizationContext $organizationContext) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewReferrals');
        $query = Referral::with('referrer:id,name,email,fan_id', 'referred:id,name,email,fan_id')
            ->whereHas('referrer', fn ($userQuery) => $this->organizationContext->applyFanScope($userQuery))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->search, fn ($q) => $q->where('referral_code', 'like', "%{$request->search}%"))
            ->orderByDesc('created_at');

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    public function updateStatus(Request $request, Referral $referral): JsonResponse
    {
        Gate::authorize(AdminPermission::ReferralsView->value);

        $referral->loadMissing('referrer');

        abort_unless(
            $referral->referrer !== null
            && $this->organizationContext->fanIsVisible($referral->referrer),
            403,
        );

        $request->validate(['status' => 'required|in:pending,active,rewarded,rejected']);

        $referral->update(['status' => $request->status]);

        ActivityLog::record('referral.status_updated', "Referral {$referral->referral_code} set to {$request->status}");

        return response()->json($referral->fresh());
    }
}
