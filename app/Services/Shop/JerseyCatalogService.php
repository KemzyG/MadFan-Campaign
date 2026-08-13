<?php

namespace App\Services\Shop;

use App\Enums\JerseySize;
use App\Models\Jersey;
use App\Models\JerseyOrder;
use App\Models\User;

class JerseyCatalogService
{
    public function __construct(private JerseyCart $cart) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function presentCatalog(?int $clubId = null): array
    {
        return Jersey::query()
            ->active()
            ->with(['club:id,name,short,logo', 'variants'])
            ->when($clubId, fn ($query) => $query->where('club_id', $clubId))
            ->orderBy('name')
            ->get()
            ->map(fn (Jersey $jersey): array => $this->presentJerseyCard($jersey))
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function presentJersey(Jersey $jersey): array
    {
        $jersey->loadMissing(['club:id,name,short,logo', 'variants']);

        return [
            ...$this->presentJerseyCard($jersey),
            'description' => $jersey->description,
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
        return [
            'id' => $jersey->id,
            'name' => $jersey->name,
            'slug' => $jersey->slug,
            'price' => (string) $jersey->price,
            'image_url' => $jersey->image_url,
            'purchasable' => $jersey->isPurchasable(),
            'stock_total' => $jersey->totalStock(),
            'club' => $jersey->club ? [
                'id' => $jersey->club->id,
                'name' => $jersey->club->name,
                'short' => $jersey->club->short,
                'logo_url' => $jersey->club->logo_url,
            ] : null,
        ];
    }
}
