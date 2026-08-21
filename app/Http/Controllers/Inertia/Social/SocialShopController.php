<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\Jersey;
use App\Models\JerseyOrder;
use App\Models\User;
use App\Services\Shop\JerseyCatalogService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SocialShopController extends Controller
{
    public function index(Request $request, JerseyCatalogService $catalog): Response
    {
        /** @var User $user */
        $user = $request->user();
        $this->authorize('viewAny', JerseyOrder::class);

        $validated = $request->validate([
            'club_id' => ['nullable', 'integer', 'exists:clubs,id'],
            'sort' => ['nullable', 'string', Rule::in(['name', 'price_asc', 'price_desc', 'newest'])],
            'in_stock' => ['nullable', 'boolean'],
        ]);

        $clubId = isset($validated['club_id']) ? (int) $validated['club_id'] : null;
        $sort = $validated['sort'] ?? 'name';
        $inStockOnly = array_key_exists('in_stock', $validated)
            ? (bool) $validated['in_stock']
            : null;

        return Inertia::render('Social/Shop/Index', [
            'jerseys' => $catalog->presentCatalog($clubId, $sort, $inStockOnly),
            'clubs' => $catalog->presentClubsWithStock(),
            'cart_count' => $catalog->presentCart()['count'],
            'filters' => [
                'club_id' => $clubId,
                'sort' => $sort,
                'in_stock' => $inStockOnly,
            ],
            'favourite_club_id' => $user->favourite_club_id,
        ]);
    }

    public function show(Request $request, Jersey $jersey, JerseyCatalogService $catalog): Response
    {
        $this->authorize('viewAny', JerseyOrder::class);

        abort_unless($jersey->is_active, 404);

        return Inertia::render('Social/Shop/Show', [
            'jersey' => $catalog->presentJersey($jersey),
            'cart_count' => $catalog->presentCart()['count'],
        ]);
    }
}
