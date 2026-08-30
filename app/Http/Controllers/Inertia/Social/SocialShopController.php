<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Enums\ProductType;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductOrder;
use App\Models\User;
use App\Services\Shop\ProductCatalogService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SocialShopController extends Controller
{
    public function index(Request $request, ProductCatalogService $catalog): Response
    {
        /** @var User|null $user */
        $user = $request->user();
        $this->authorize('viewAny', ProductOrder::class);

        $validated = $request->validate([
            'type' => ['nullable', 'string', Rule::in(ProductType::values())],
            'fandom_id' => ['nullable', 'integer', 'exists:fandoms,id'],
            'club_id' => ['nullable', 'integer', 'exists:clubs,id'],
            'club' => ['nullable', 'integer', 'exists:clubs,id'],
            'league_id' => ['nullable', 'integer', 'exists:leagues,id'],
            'league' => ['nullable', 'integer', 'exists:leagues,id'],
            'category' => ['nullable', 'string'],
            'sort' => ['nullable', 'string', Rule::in(['name', 'price_asc', 'price_desc', 'newest'])],
            'in_stock' => ['nullable', 'boolean'],
        ]);

        $type = isset($validated['type']) ? ProductType::from($validated['type']) : null;
        $fandomId = isset($validated['fandom_id']) ? (int) $validated['fandom_id'] : null;
        $clubId = isset($validated['club_id']) || isset($validated['club'])
            ? (int) ($validated['club_id'] ?? $validated['club'])
            : null;
        $leagueId = isset($validated['league_id']) || isset($validated['league'])
            ? (int) ($validated['league_id'] ?? $validated['league'])
            : null;
        $category = $validated['category'] ?? null;
        $sort = $validated['sort'] ?? 'name';
        $inStockOnly = array_key_exists('in_stock', $validated)
            ? (bool) $validated['in_stock']
            : null;

        return Inertia::render('Social/Shop/Index', [
            'products' => $catalog->presentCatalog($type, $fandomId, $clubId, $leagueId, $category, $sort, $inStockOnly),
            'featured' => $catalog->presentFeatured(),
            'types' => $catalog->presentTypes(),
            'fandoms' => $catalog->presentFandomsWithStock(),
            'clubs' => $catalog->presentClubsWithStock(),
            'leagues' => $catalog->presentLeaguesWithStock(),
            'categories' => $catalog->presentCategories($type),
            'cart_count' => $catalog->presentCart()['count'],
            'filters' => [
                'type' => $type?->value,
                'fandom_id' => $fandomId,
                'club_id' => $clubId,
                'league_id' => $leagueId,
                'category' => $category,
                'sort' => $sort,
                'in_stock' => $inStockOnly,
            ],
            'favourite_club_id' => $user?->favourite_club_id,
        ]);
    }

    public function show(Request $request, Product $product, ProductCatalogService $catalog): Response
    {
        $this->authorize('viewAny', ProductOrder::class);

        abort_unless($product->is_active, 404);

        return Inertia::render('Social/Shop/Show', [
            'product' => $catalog->presentProduct($product),
            'cart_count' => $catalog->presentCart()['count'],
        ]);
    }
}
