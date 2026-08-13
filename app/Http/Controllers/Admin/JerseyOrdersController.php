<?php

namespace App\Http\Controllers\Admin;

use App\Enums\JerseyOrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateJerseyOrderRequest;
use App\Models\ActivityLog;
use App\Models\JerseyOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class JerseyOrdersController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewJerseyOrders');

        $orders = JerseyOrder::query()
            ->with(['user:id,name,email', 'items'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json($orders);
    }

    public function show(JerseyOrder $jerseyOrder): JsonResponse
    {
        Gate::authorize('viewJerseyOrders');

        return response()->json($jerseyOrder->load(['user:id,name,email', 'items']));
    }

    public function update(UpdateJerseyOrderRequest $request, JerseyOrder $jerseyOrder): JsonResponse
    {
        Gate::authorize('manageJerseyOrders');

        $status = JerseyOrderStatus::from($request->validated('status'));

        $jerseyOrder->status = $status;

        if ($status === JerseyOrderStatus::Confirmed && $jerseyOrder->confirmed_at === null) {
            $jerseyOrder->confirmed_at = now();
        }

        if ($status === JerseyOrderStatus::Fulfilled) {
            $jerseyOrder->fulfilled_at ??= now();
            $jerseyOrder->confirmed_at ??= now();
        }

        if ($status === JerseyOrderStatus::Cancelled) {
            $jerseyOrder->fulfilled_at = null;
        }

        $jerseyOrder->save();

        ActivityLog::record('jersey_order.updated', "Updated jersey order {$jerseyOrder->code} to {$status->value}");

        return response()->json($jerseyOrder->fresh()->load(['user:id,name,email', 'items']));
    }
}
