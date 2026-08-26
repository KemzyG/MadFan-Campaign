<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\ProductOrder;
use App\Models\User;
use App\Services\Shop\ProductCatalogService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialShopOrderController extends Controller
{
    public function index(Request $request, ProductCatalogService $catalog): Response
    {
        /** @var User $user */
        $user = $request->user();
        $this->authorize('viewAny', ProductOrder::class);

        return Inertia::render('Social/Shop/Orders', [
            'orders' => $catalog->presentUserOrders($user),
            'cart_count' => $catalog->presentCart()['count'],
        ]);
    }

    public function show(Request $request, ProductOrder $order, ProductCatalogService $catalog): Response
    {
        $this->authorize('view', $order);

        return Inertia::render('Social/Shop/OrderShow', [
            'order' => $catalog->presentOrder($order),
            'cart_count' => $catalog->presentCart()['count'],
        ]);
    }
}
