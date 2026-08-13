<?php

namespace App\Http\Controllers\Inertia;

use App\Enums\JerseyOrderStatus;
use App\Http\Controllers\Controller;
use App\Models\JerseyOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class JerseyOrdersPageController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewJerseyOrders');

        $orders = JerseyOrder::query()
            ->with(['user:id,name,email', 'items'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('q'), function ($query) use ($request): void {
                $term = '%'.$request->string('q').'%';
                $query->where(function ($inner) use ($term): void {
                    $inner->where('code', 'like', $term)
                        ->orWhere('shipping_name', 'like', $term)
                        ->orWhereHas('user', fn ($user) => $user->where('email', 'like', $term));
                });
            })
            ->latest()
            ->paginate($request->integer('per_page', 20))
            ->withQueryString();

        return Inertia::render('Admin/JerseyOrders/Index', [
            'orders' => $orders,
            'statuses' => collect(JerseyOrderStatus::cases())->map(fn (JerseyOrderStatus $status): array => [
                'value' => $status->value,
                'label' => $status->label(),
            ])->all(),
            'filters' => [
                'status' => $request->string('status')->toString() ?: null,
                'q' => $request->string('q')->toString() ?: null,
            ],
            'canManage' => Gate::allows('manageJerseyOrders'),
        ]);
    }
}
