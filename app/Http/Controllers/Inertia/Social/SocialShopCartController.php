<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shop\AddProductToCartRequest;
use App\Http\Requests\Shop\UpdateProductCartRequest;
use App\Models\ProductOrder;
use App\Models\ProductVariant;
use App\Services\Shop\ProductCart;
use App\Services\Shop\ProductCatalogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialShopCartController extends Controller
{
    public function show(Request $request, ProductCatalogService $catalog): Response
    {
        $this->authorize('create', ProductOrder::class);

        return Inertia::render('Social/Shop/Cart', [
            'cart' => $catalog->presentCart(),
        ]);
    }

    public function store(AddProductToCartRequest $request, ProductCart $cart): RedirectResponse
    {
        $this->authorize('create', ProductOrder::class);

        $cart->add(
            (int) $request->validated('variant_id'),
            (int) ($request->validated('quantity') ?? 1),
        );

        return back()->with('success', 'Added to bag.');
    }

    public function update(
        UpdateProductCartRequest $request,
        ProductVariant $variant,
        ProductCart $cart,
    ): RedirectResponse {
        $this->authorize('create', ProductOrder::class);

        $cart->update($variant->id, (int) $request->validated('quantity'));

        return back()->with('success', 'Bag updated.');
    }

    public function destroy(Request $request, ProductVariant $variant, ProductCart $cart): RedirectResponse
    {
        $this->authorize('create', ProductOrder::class);

        $cart->remove($variant->id);

        return back()->with('success', 'Removed from bag.');
    }
}
