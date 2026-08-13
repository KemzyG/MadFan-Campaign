<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shop\AddJerseyToCartRequest;
use App\Http\Requests\Shop\UpdateJerseyCartRequest;
use App\Models\JerseyOrder;
use App\Models\JerseyVariant;
use App\Services\Shop\JerseyCart;
use App\Services\Shop\JerseyCatalogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialShopCartController extends Controller
{
    public function show(Request $request, JerseyCatalogService $catalog): Response
    {
        $this->authorize('create', JerseyOrder::class);

        return Inertia::render('Social/Shop/Cart', [
            'cart' => $catalog->presentCart(),
        ]);
    }

    public function store(AddJerseyToCartRequest $request, JerseyCart $cart): RedirectResponse
    {
        $this->authorize('create', JerseyOrder::class);

        $cart->add(
            (int) $request->validated('variant_id'),
            (int) ($request->validated('quantity') ?? 1),
        );

        return back()->with('success', 'Added to bag.');
    }

    public function update(
        UpdateJerseyCartRequest $request,
        JerseyVariant $variant,
        JerseyCart $cart,
    ): RedirectResponse {
        $this->authorize('create', JerseyOrder::class);

        $cart->update($variant->id, (int) $request->validated('quantity'));

        return back()->with('success', 'Bag updated.');
    }

    public function destroy(Request $request, JerseyVariant $variant, JerseyCart $cart): RedirectResponse
    {
        $this->authorize('create', JerseyOrder::class);

        $cart->remove($variant->id);

        return back()->with('success', 'Removed from bag.');
    }
}
