<?php

namespace App\Services\Shop;

use App\Enums\JerseySize;
use App\Models\Club;
use App\Models\Jersey;
use App\Models\JerseyOrder;
use App\Models\League;
use App\Models\MediaAsset;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class JerseyCatalogService
{
    /**
     * @var list<array{slug: string, label: string, pattern: string}>
     */
    private const KIT_CATEGORIES = [
        ['slug' => 'home', 'label' => 'Home', 'pattern' => '%Home%'],
        ['slug' => 'away', 'label' => 'Away', 'pattern' => '%Away%'],
        ['slug' => 'third', 'label' => 'Third', 'pattern' => '%Third%'],
        ['slug' => 'training', 'label' => 'Training', 'pattern' => '%Training%'],
        ['slug' => 'terrace', 'label' => 'Terrace tee', 'pattern' => '%Terrace%'],
    ];

    public function __construct(private JerseyCart $cart) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function presentCatalog(
        ?int $clubId = null,
        string $sort = 'name',
        ?bool $inStockOnly = null,
        ?string $category = null,
        ?int $leagueId = null,
    ): array {
        return Jersey::query()
            ->active()
            ->with(['club:id,name,short,logo,league_id', 'variants', 'mediaAssets'])
            ->when($clubId, fn ($query) => $query->where('club_id', $clubId))
            ->when($leagueId, function (Builder $query) use ($leagueId): void {
                $query->whereHas('club', fn (Builder $clubs) => $clubs->where('league_id', $leagueId));
            })
            ->when(filled($category), fn (Builder $query) => $this->applyCategoryFilter($query, $category))
            ->when($inStockOnly === true, function (Builder $query): void {
                $query->whereHas('variants', fn (Builder $variants) => $variants->where('stock', '>', 0));
            })
            ->tap(fn (Builder $query) => $this->applySort($query, $sort))
            ->get()
            ->map(fn (Jersey $jersey): array => $this->presentJerseyCard($jersey))
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function presentFeaturedJerseys(int $limit = 8): array
    {
        return Jersey::query()
            ->active()
            ->with(['club:id,name,short,logo', 'variants', 'mediaAssets'])
            ->whereHas('variants', fn (Builder $variants) => $variants->where('stock', '>', 0))
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(fn (Jersey $jersey): array => $this->presentJerseyCard($jersey))
            ->all();
    }

    /**
     * @return list<array{slug: string, label: string, count: int}>
     */
    public function presentCategories(): array
    {
        return collect(self::KIT_CATEGORIES)
            ->map(function (array $category): array {
                $count = Jersey::query()
                    ->active()
                    ->where('name', 'like', $category['pattern'])
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
     * @return list<array{id: int, name: string, short: string|null}>
     */
    public function presentLeaguesWithStock(): array
    {
        return League::query()
            ->whereHas('clubs.jerseys', fn (Builder $query) => $query->active())
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
     * @return list<array{id: int, name: string, short: string|null}>
     */
    public function presentClubsWithStock(): array
    {
        return Club::query()
            ->whereHas('jerseys', fn (Builder $query) => $query->active())
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
    public function presentJersey(Jersey $jersey): array
    {
        $jersey->loadMissing(['club:id,name,short,logo', 'variants', 'mediaAssets']);

        return [
            ...$this->presentJerseyCard($jersey),
            'description' => $jersey->description,
            'images' => $this->presentImages($jersey),
            'variants' => $jersey->variants
                ->sortBy(fn ($variant) => array_search($variant->size->value, JerseySize::values(), true))
                ->values()
                ->map(fn ($variant): array => [
                    'id' => $variant->id,
                    'size' => $variant->size->value,
                    'stock' => $variant->stock,
                    'in_stock' => $variant->stock > 0,
                ])
                ->all(),
        ];
    }

    /**
     * @return array{items: list<array<string, mixed>>, total: string, count: int}
     */
    public function presentCart(): array
    {
        $items = $this->cart->resolvedLines()
            ->map(fn (array $line): array => [
                'variant_id' => $line['variant']->id,
                'jersey_id' => $line['variant']->jersey_id,
                'name' => $line['variant']->jersey->name,
                'slug' => $line['variant']->jersey->slug,
                'image_url' => $line['variant']->jersey->image_url,
                'club' => $line['variant']->jersey->club ? [
                    'id' => $line['variant']->jersey->club->id,
                    'name' => $line['variant']->jersey->club->name,
                    'short' => $line['variant']->jersey->club->short,
                    'logo_url' => $line['variant']->jersey->club->logo_url,
                ] : null,
                'size' => $line['variant']->size->value,
                'quantity' => $line['quantity'],
                'unit_price' => $line['unit_price'],
                'line_total' => $line['line_total'],
                'stock' => $line['variant']->stock,
            ])
            ->all();

        return [
            'items' => $items,
            'total' => $this->cart->total(),
            'count' => $this->cart->count(),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function presentUserOrders(User $user): array
    {
        return JerseyOrder::query()
            ->where('user_id', $user->id)
            ->with('items')
            ->latest()
            ->get()
            ->map(fn (JerseyOrder $order): array => $this->presentOrder($order))
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function presentOrder(JerseyOrder $order): array
    {
        $order->loadMissing('items');

        return [
            'id' => $order->id,
            'code' => $order->code,
            'status' => $order->status->value,
            'status_label' => $order->status->label(),
            'total' => (string) $order->total,
            'confirmed_at' => $order->confirmed_at?->toIso8601String(),
            'fulfilled_at' => $order->fulfilled_at?->toIso8601String(),
            'shipping' => [
                'name' => $order->shipping_name,
                'line1' => $order->shipping_line1,
                'line2' => $order->shipping_line2,
                'city' => $order->shipping_city,
                'postcode' => $order->shipping_postcode,
                'country' => $order->shipping_country,
            ],
            'items' => $order->items->map(fn ($item): array => [
                'id' => $item->id,
                'name' => $item->name,
                'size' => $item->size->value,
                'quantity' => $item->quantity,
                'unit_price' => (string) $item->unit_price,
                'line_total' => (string) $item->line_total,
            ])->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function presentJerseyCard(Jersey $jersey): array
    {
        $images = $this->presentImages($jersey);
        $inStockSizes = $jersey->variants
            ->filter(fn ($variant): bool => $variant->stock > 0)
            ->sortBy(fn ($variant) => array_search($variant->size->value, JerseySize::values(), true))
            ->values()
            ->map(fn ($variant): string => $variant->size->value)
            ->all();

        return [
            'id' => $jersey->id,
            'name' => $jersey->name,
            'slug' => $jersey->slug,
            'price' => (string) $jersey->price,
            'image_url' => $images[0]['url'] ?? $jersey->image_url,
            'purchasable' => $jersey->isPurchasable(),
            'stock_total' => $jersey->totalStock(),
            'sizes_available' => $inStockSizes,
            'kit_kind' => $this->detectKitKind($jersey->name),
            'gallery_count' => count($images),
            'club' => $jersey->club ? [
                'id' => $jersey->club->id,
                'name' => $jersey->club->name,
                'short' => $jersey->club->short,
                'logo_url' => $jersey->club->logo_url,
            ] : null,
        ];
    }

    private function detectKitKind(string $name): ?string
    {
        if (preg_match('/\b(Terrace Tee|Terrace)\b/i', $name) === 1) {
            return 'Terrace';
        }

        if (preg_match('/\b(Home|Away|Third|Training)\b/i', $name, $matches) !== 1) {
            return null;
        }

        return ucfirst(strtolower($matches[1]));
    }

    private function applyCategoryFilter(Builder $query, string $category): void
    {
        $pattern = collect(self::KIT_CATEGORIES)
            ->firstWhere('slug', strtolower($category))['pattern'] ?? null;

        if ($pattern !== null) {
            $query->where('name', 'like', $pattern);
        }
    }

    /**
     * @return list<array{id: int|string, url: string, alt: string|null, title: string|null}>
     */
    private function presentImages(Jersey $jersey): array
    {
        $images = $jersey->mediaAssets
            ->map(fn (MediaAsset $asset): array => $asset->toShopImage())
            ->values()
            ->all();

        if ($images === [] && filled($jersey->image)) {
            $images[] = [
                'id' => 'primary',
                'url' => $jersey->image_url,
                'alt' => $jersey->name,
                'title' => $jersey->name,
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
