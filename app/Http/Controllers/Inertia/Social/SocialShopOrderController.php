<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\JerseyOrder;
use App\Models\User;
use App\Services\Shop\JerseyCatalogService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialShopOrderController extends Controller
{
    public function index(Request $request, JerseyCatalogService $catalog): Response
    {
        /** @var User $user */
        $user = $request->user();
        $this->authorize('viewAny', JerseyOrder::class);

        return Inertia::render('Social/Shop/Orders', [
            'orders' => $catalog->presentUserOrders($user),
            'cart_count' => $catalog->presentCart()['count'],
        ]);
    }

    public function show(Request $request, JerseyOrder $order, JerseyCatalogService $catalog): Response
    {
        $this->authorize('view', $order);

        return Inertia::render('Social/Shop/OrderShow', [
            'order' => $catalog->presentOrder($order),
            'cart_count' => $catalog->presentCart()['count'],
        ]);
    }
}
