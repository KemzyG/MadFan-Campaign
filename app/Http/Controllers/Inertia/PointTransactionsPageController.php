<?php

namespace App\Http\Controllers\Inertia;

use App\Enums\PointSourceType;
use App\Http\Controllers\Controller;
use App\Models\PointTransaction;
use App\Models\Season;
use App\Services\Admin\AdminOrganizationContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PointTransactionsPageController extends Controller
{
    public function __construct(private AdminOrganizationContext $organizationContext) {}

    public function index(Request $request): Response
    {
        Gate::authorize('viewPointTransactions');

        $transactions = PointTransaction::query()
            ->with('user:id,name,email,fan_id', 'season:id,name,code')
            ->whereHas('user', fn ($query) => $this->organizationContext->applyFanScope($query))
            ->when($request->user_id, fn ($q) => $q->where('user_id', $request->user_id))
            ->when($request->season_id, fn ($q) => $q->where('season_id', $request->season_id))
            ->when($request->source_type, fn ($q) => $q->where('source_type', $request->source_type))
            ->when($request->date_from, fn ($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to, fn ($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 50)
            ->withQueryString();

        return Inertia::render('Admin/PointTransactions/Index', [
            'transactions' => $transactions,
            'filters' => $request->only(['user_id', 'season_id', 'source_type', 'date_from', 'date_to']),
            'seasons' => Season::query()->orderByDesc('starts_at')->get(['id', 'name', 'code']),
            'sourceTypes' => PointSourceType::adminFilterValues(),
            'sourceTypeLabels' => PointSourceType::labels(),
        ]);
    }
}
