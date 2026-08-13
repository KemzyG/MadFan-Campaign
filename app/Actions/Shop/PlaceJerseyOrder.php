<?php

namespace App\Actions\Shop;

use App\Enums\JerseyOrderStatus;
use App\Models\JerseyOrder;
use App\Models\JerseyOrderItem;
use App\Models\JerseyVariant;
use App\Models\User;
use App\Services\Shop\JerseyCart;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PlaceJerseyOrder
{
    public function __construct(private JerseyCart $cart) {}

    /**
     * @param  array{
     *     shipping_name: string,
     *     shipping_line1: string,
     *     shipping_line2?: string|null,
     *     shipping_city: string,
     *     shipping_postcode: string,
     *     shipping_country?: string
     * }  $shipping
     */
    public function handle(User $user, array $shipping): JerseyOrder
    {
        $lines = $this->cart->resolvedLines();

        if ($lines->isEmpty()) {
            throw ValidationException::withMessages([
                'cart' => 'Your cart is empty.',
            ]);
        }

        return DB::transaction(function () use ($user, $shipping, $lines): JerseyOrder {
            $total = '0.00';
            $prepared = [];

            foreach ($lines as $line) {
                /** @var JerseyVariant $variant */
                $variant = JerseyVariant::query()
                    ->with('jersey')
                    ->whereKey($line['variant']->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if (! $variant->jersey?->is_active) {
                    throw ValidationException::withMessages([
                        'cart' => "{$line['variant']->jersey?->name} is no longer available.",
                    ]);
                }

                if (! $variant->isInStock($line['quantity'])) {
                    throw ValidationException::withMessages([
                        'cart' => "Not enough stock for {$variant->jersey->name} ({$variant->size->value}).",
                    ]);
                }

                $unitPrice = (string) $variant->jersey->price;
                $lineTotal = bcmul($unitPrice, (string) $line['quantity'], 2);
                $total = bcadd($total, $lineTotal, 2);

                $prepared[] = [
                    'variant' => $variant,
                    'quantity' => $line['quantity'],
                    'unit_price' => $unitPrice,
                    'line_total' => $lineTotal,
                ];
            }

            $order = JerseyOrder::query()->create([
                'user_id' => $user->id,
                'status' => JerseyOrderStatus::Confirmed,
                'code' => JerseyOrder::generateCode(),
                'total' => $total,
                'shipping_name' => $shipping['shipping_name'],
                'shipping_line1' => $shipping['shipping_line1'],
                'shipping_line2' => $shipping['shipping_line2'] ?? null,
                'shipping_city' => $shipping['shipping_city'],
                'shipping_postcode' => $shipping['shipping_postcode'],
                'shipping_country' => strtoupper($shipping['shipping_country'] ?? 'GB'),
                'confirmed_at' => now(),
            ]);

            foreach ($prepared as $item) {
                /** @var JerseyVariant $variant */
                $variant = $item['variant'];

                JerseyOrderItem::query()->create([
                    'jersey_order_id' => $order->id,
                    'jersey_id' => $variant->jersey_id,
                    'jersey_variant_id' => $variant->id,
                    'name' => $variant->jersey->name,
                    'size' => $variant->size,
                    'unit_price' => $item['unit_price'],
                    'quantity' => $item['quantity'],
                    'line_total' => $item['line_total'],
                ]);

                $variant->decrement('stock', $item['quantity']);
            }

            $this->cart->clear();

            return $order->load('items');
        });
    }
}
