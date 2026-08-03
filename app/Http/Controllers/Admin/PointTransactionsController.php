<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PointTransaction;
use App\Services\Admin\AdminOrganizationContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PointTransactionsController extends Controller
{
    public function __construct(private AdminOrganizationContext $organizationContext) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewPointTransactions');
        $query = PointTransaction::with('user:id,name,email,fan_id', 'season:id,name,code')
            ->whereHas('user', fn ($userQuery) => $this->organizationContext->applyFanScope($userQuery))
            ->when($request->user_id, fn ($q) => $q->where('user_id', $request->user_id))
            ->when($request->season_id, fn ($q) => $q->where('season_id', $request->season_id))
            ->when($request->source_type, fn ($q) => $q->where('source_type', $request->source_type))
            ->when($request->date_from, fn ($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to, fn ($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->orderByDesc('created_at');

        return response()->json($query->paginate($request->per_page ?? 50));
    }
}
