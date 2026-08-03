<?php

namespace App\Http\Controllers\Inertia;

use App\Http\Controllers\Controller;
use App\Models\Referral;
use App\Services\Admin\AdminOrganizationContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ReferralsPageController extends Controller
{
    public function __construct(private AdminOrganizationContext $organizationContext) {}

    public function index(Request $request): Response
    {
        Gate::authorize('viewReferrals');

        $referrals = Referral::query()
            ->with('referrer:id,name,email,fan_id', 'referred:id,name,email,fan_id')
            ->whereHas('referrer', fn ($query) => $this->organizationContext->applyFanScope($query))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->search, fn ($q) => $q->where('referral_code', 'like', "%{$request->search}%"))
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 20)
            ->withQueryString();

        return Inertia::render('Admin/Referrals/Index', [
            'referrals' => $referrals,
            'filters' => $request->only(['status', 'search']),
            'statuses' => ['pending', 'active', 'rewarded', 'rejected'],
        ]);
    }
}
