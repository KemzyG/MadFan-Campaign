<?php

namespace App\Services\Shop;

use App\Enums\ProductType;
use App\Models\Club;
use App\Models\Fandom;
use App\Models\League;
use App\Models\Product;
use App\Models\ProductOrder;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class ProductCatalogService
{
    /**
     * Categories grouped by product type, purely for filter UI — a
     * subscription doesn't have a "home/away" kit category and an NFT
     * doesn't have a size, so the rail only ever shows what's relevant.
     *
     * @var array<string, list<array{slug: string, label: string}>>
     */
    private const CATEGORIES = [
        'apparel' => [
            ['slug' => 'kit', 'label' => 'Kits'],
            ['slug' => 'boots', 'label' => 'Boots'],
            ['slug' => 'training', 'label' => 'Training'],
            ['slug' => 'socks', 'label' => 'Socks'],
            ['slug' => 'caps', 'label' => 'Caps'],
        ],
        'collectible' => [
            ['slug' => 'nft', 'label' => 'Collectible cards'],
        ],
        'subscription' => [
            ['slug' => 'streaming', 'label' => 'Streaming'],
            ['slug' => 'gaming', 'label' => 'Gaming credits'],
            ['slug' => 'music', 'label' => 'Music'],
        ],
    ];

    public function __construct(private ProductCart $cart) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function presentCatalog(
        ?ProductType $type = null,
        ?int $fandomId = null,
        ?int $clubId = null,
        ?int $leagueId = null,
        ?string $category = null,
        string $sort = 'name',
        ?bool $inStockOnly = null,
    ): array {
        return Product::query()
            ->active()
            ->with(['club:id,name,short,logo,league_id', 'fandom:id,name,slug,icon', 'variants'])
            ->when($type, fn (Builder $query) => $query->ofType($type))
            ->when($fandomId, fn (Builder $query) => $query->where('fandom_id', $fandomId))
            ->when($clubId, fn (Builder $query) => $query->where('club_id', $clubId))
            ->when($leagueId, function (Builder $query) use ($leagueId): void {
                $query->whereHas('club', fn (Builder $clubs) => $clubs->where('league_id', $leagueId));
            })
            ->when(filled($category), fn (Builder $query) => $query->where('category', strtolower((string) $category)))
            ->when($inStockOnly === true, function (Builder $query): void {
                $query->where(function (Builder $inStock): void {
                    $inStock->whereDoesntHave('variants')
                        ->orWhereHas('variants', fn (Builder $variants) => $variants->whereNull('stock')->orWhere('stock', '>', 0));
                });
            })
            ->tap(fn (Builder $query) => $this->applySort($query, $sort))
            ->get()
            ->map(fn (Product $product): array => $this->presentProductCard($product))
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function presentFeatured(int $limit = 8): array
    {
        return Product::query()
            ->active()
            ->with(['club:id,name,short,logo', 'fandom:id,name,slug,icon', 'variants'])
            ->where('is_featured', true)
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(fn (Product $product): array => $this->presentProductCard($product))
            ->all();
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public function presentTypes(): array
    {
        return collect(ProductType::cases())
            ->filter(fn (ProductType $type): bool => Product::query()->active()->ofType($type)->exists())
            ->map(fn (ProductType $type): array => ['value' => $type->value, 'label' => $type->label()])
            ->values()
            ->all();
    }

    /**
     * @return list<array{slug: string, label: string, count: int}>
     */
    public function presentCategories(?ProductType $type = null): array
    {
        $pool = $type ? (self::CATEGORIES[$type->value] ?? []) : collect(self::CATEGORIES)->flatten(1)->all();

        return collect($pool)
            ->unique('slug')
            ->map(function (array $category) use ($type): array {
                $count = Product::query()
                    ->active()
                    ->when($type, fn (Builder $query) => $query->ofType($type))
                    ->where('category', $category['slug'])
                    ->count();

                return [
                    'slug' => $category['slug'],
                    'label' => $category['label'],
                    'count' => $count,
                ];
            })
            ->filter(fn (array $category): bool => $category['count'] > 0)
            ->values()
            ->all();
    }

    /**
     * @return list<array{id: int, name: string, slug: string, icon: string|null}>
     */
    public function presentFandomsWithStock(): array
    {
        return Fandom::query()
            ->whereHas('products', fn (Builder $query) => $query->active())
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'icon'])
            ->map(fn (Fandom $fandom): array => [
                'id' => $fandom->id,
                'name' => $fandom->name,
                'slug' => $fandom->slug,
                'icon' => $fandom->icon,
            ])
            ->all();
    }

    /**
     * @return list<array{id: int, name: string, short: string|null}>
     */
    public function presentLeaguesWithStock(): array
    {
        return League::query()
            ->whereHas('clubs.products', fn (Builder $query) => $query->active())
            ->orderBy('name')
            ->get(['id', 'name', 'short'])
            ->map(fn (League $league): array => [
                'id' => $league->id,
                'name' => $league->name,
                'short' => $league->short,
            ])
            ->all();
    }

    /**
     * @return list<array{id: int, name: string, short: string|null, logo_url: string}>
     */
    public function presentClubsWithStock(): array
    {
        return Club::query()
            ->whereHas('products', fn (Builder $query) => $query->active())
            ->orderBy('name')
            ->get(['id', 'name', 'short', 'logo'])
            ->map(fn (Club $club): array => [
                'id' => $club->id,
                'name' => $club->name,
                'short' => $club->short,
                'logo_url' => $club->logo_url,
            ])
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function presentProduct(Product $product): array
    {
        $product->loadMissing(['club:id,name,short,logo', 'fandom:id,name,slug,icon', 'variants']);

        return [
            ...$this->presentProductCard($product),
            'description' => $product->description,
            'brand' => $product->brand,
            'attributes' => $product->attributes ?? [],
            'requires_shipping' => $product->requiresShipping(),
            'images' => $this->presentImages($product),
            'variants' => $product->variants
                ->values()
                ->map(fn ($variant): array => [
                    'id' => $variant->id,
                    'label' => $variant->label,
                    'stock' => $variant->stock,
                    'in_stock' => $variant->isInStock(),
                    'price' => $variant->price(),
                ])
                ->all(),
        ];
    }

    /**
     * @return array{items: list<array<string, mixed>>, total: string, count: int, requires_shipping: bool}
     */
    public function presentCart(): array
    {
        $items = $this->cart->resolvedLines()
            ->map(fn (array $line): array => [
                'variant_id' => $line['variant']->id,
                'product_id' => $line['variant']->product_id,
                'name' => $line['variant']->product->name,
                'slug' => $line['variant']->product->slug,
                'image_url' => $line['variant']->product->image_url,
                'product_type' => $line['variant']->product->product_type->value,
                'club' => $line['variant']->product->club ? [
                    'id' => $line['variant']->product->club->id,
                    'name' => $line['variant']->product->club->name,
                    'short' => $line['variant']->product->club->short,
                    'logo_url' => $line['variant']->product->club->logo_url,
                ] : null,
                'variant_label' => $line['variant']->label,
                'quantity' => $line['quantity'],
                'unit_price' => $line['unit_price'],
                'line_total' => $line['line_total'],
                'stock' => $line['variant']->stock,
                'requires_shipping' => $line['variant']->product->requiresShipping(),
            ])
            ->all();

        return [
            'items' => $items,
            'total' => $this->cart->total(),
            'count' => $this->cart->count(),
            'requires_shipping' => $this->cart->requiresShipping(),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function presentUserOrders(User $user): array
    {
        return ProductOrder::query()
            ->where('user_id', $user->id)
            ->with('items')
            ->latest()
            ->get()
            ->map(fn (ProductOrder $order): array => $this->presentOrder($order))
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function presentOrder(ProductOrder $order): array
    {
        $order->loadMissing('items');

        return [
            'id' => $order->id,
            'code' => $order->code,
            'status' => $order->status->value,
            'status_label' => $order->status->label(),
            'total' => (string) $order->total,
            'requires_shipping' => $order->requires_shipping,
            'confirmed_at' => $order->confirmed_at?->toIso8601String(),
            'fulfilled_at' => $order->fulfilled_at?->toIso8601String(),
            'shipping' => $order->requires_shipping ? [
                'name' => $order->shipping_name,
                'line1' => $order->shipping_line1,
                'line2' => $order->shipping_line2,
                'city' => $order->shipping_city,
                'postcode' => $order->shipping_postcode,
                'country' => $order->shipping_country,
            ] : null,
            'items' => $order->items->map(fn ($item): array => [
                'id' => $item->id,
                'name' => $item->name,
                'variant_label' => $item->variant_label,
                'product_type' => $item->product_type->value,
                'quantity' => $item->quantity,
                'unit_price' => (string) $item->unit_price,
                'line_total' => (string) $item->line_total,
            ])->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function presentProductCard(Product $product): array
    {
        $images = $this->presentImages($product);
        $availableOptions = $product->variants
            ->filter(fn ($variant): bool => $variant->isInStock())
            ->values()
            ->map(fn ($variant): string => $variant->label)
            ->all();

        return [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'product_type' => $product->product_type->value,
            'category' => $product->category,
            'brand' => $product->brand,
            'price' => (string) $product->price,
            'currency' => $product->currency,
            'image_url' => $images[0]['url'] ?? $product->image_url,
            'purchasable' => $product->isPurchasable(),
            'stock_total' => $product->totalStock(),
            'is_digital' => $product->is_digital,
            'options_available' => $availableOptions,
            'gallery_count' => count($images),
            'club' => $product->club ? [
                'id' => $product->club->id,
                'name' => $product->club->name,
                'short' => $product->club->short,
                'logo_url' => $product->club->logo_url,
            ] : null,
            'fandom' => $product->fandom ? [
                'id' => $product->fandom->id,
                'name' => $product->fandom->name,
                'slug' => $product->fandom->slug,
                'icon' => $product->fandom->icon,
            ] : null,
        ];
    }

    /**
     * @return list<array{id: int|string, url: string, alt: string|null, title: string|null}>
     */
    private function presentImages(Product $product): array
    {
        $images = collect($product->gallery_urls ?? [])
            ->map(fn (string $url, int $index): array => [
                'id' => $index,
                'url' => $url,
                'alt' => $product->name,
                'title' => $product->name,
            ])
            ->values()
            ->all();

        if ($images === [] && filled($product->image)) {
            $images[] = [
                'id' => 'primary',
                'url' => $product->image_url,
                'alt' => $product->name,
                'title' => $product->name,
            ];
        }

        return $images;
    }

    private function applySort(Builder $query, string $sort): void
    {
        match ($sort) {
            'price_asc' => $query->orderBy('price')->orderBy('name'),
            'price_desc' => $query->orderByDesc('price')->orderBy('name'),
            'newest' => $query->orderByDesc('id'),
            default => $query->orderBy('name'),
        };
    }
}
