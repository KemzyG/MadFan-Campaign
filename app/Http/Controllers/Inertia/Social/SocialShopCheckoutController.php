<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Actions\Shop\PlaceJerseyOrder;
use App\Http\Controllers\Controller;
use App\Http\Requests\Shop\CheckoutJerseyCartRequest;
use App\Models\JerseyOrder;
use App\Models\User;
use App\Services\Shop\JerseyCatalogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialShopCheckoutController extends Controller
{
    public function create(Request $request, JerseyCatalogService $catalog): Response|RedirectResponse
    {
        $this->authorize('create', JerseyOrder::class);

        $cart = $catalog->presentCart();

        if ($cart['count'] === 0) {
            return redirect()
                ->route('social.shop.cart')
                ->with('error', 'Your bag is empty.');
        }

        /** @var User $user */
        $user = $request->user();

        return Inertia::render('Social/Shop/Checkout', [
            'cart' => $cart,
            'defaults' => [
                'shipping_name' => $user->name,
                'shipping_line1' => '',
                'shipping_line2' => '',
                'shipping_city' => '',
                'shipping_postcode' => '',
                'shipping_country' => 'GB',
            ],
        ]);
    }

    public function store(
        CheckoutJerseyCartRequest $request,
        PlaceJerseyOrder $placeOrder,
    ): RedirectResponse {
        /** @var User $user */
        $user = $request->user();

        $this->authorize('create', JerseyOrder::class);

        $order = $placeOrder->handle($user, $request->shipping());

        return redirect()
            ->route('social.shop.orders.show', $order)
            ->with('success', 'Order confirmed — packing soon. No card rails on this pass.');
    }
}
