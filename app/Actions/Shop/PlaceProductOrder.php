<?php

namespace App\Actions\Shop;

use App\Enums\ProductOrderStatus;
use App\Models\ProductOrder;
use App\Models\ProductOrderItem;
use App\Models\ProductVariant;
use App\Models\User;
use App\Services\Shop\ProductCart;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PlaceProductOrder
{
    public function __construct(private ProductCart $cart) {}

    /**
     * @param  array{
     *     shipping_name?: string|null,
     *     shipping_line1?: string|null,
     *     shipping_line2?: string|null,
     *     shipping_city?: string|null,
     *     shipping_postcode?: string|null,
     *     shipping_country?: string|null
     * }  $shipping
     */
    public function handle(User $user, array $shipping): ProductOrder
    {
        $lines = $this->cart->resolvedLines();

        if ($lines->isEmpty()) {
            throw ValidationException::withMessages([
                'cart' => 'Your bag is empty.',
            ]);
        }

        $requiresShipping = $lines->contains(fn (array $line): bool => $line['variant']->product->requiresShipping());

        if ($requiresShipping) {
            $this->validateShipping($shipping);
        }

        return DB::transaction(function () use ($user, $shipping, $lines, $requiresShipping): ProductOrder {
            $total = '0.00';
            $prepared = [];

            foreach ($lines as $line) {
                /** @var ProductVariant $variant */
                $variant = ProductVariant::query()
                    ->with('product')
                    ->whereKey($line['variant']->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if (! $variant->product?->is_active) {
                    throw ValidationException::withMessages([
                        'cart' => "{$line['variant']->product?->name} is no longer available.",
                    ]);
                }

                if (! $variant->isInStock($line['quantity'])) {
                    throw ValidationException::withMessages([
                        'cart' => "Not enough stock for {$variant->product->name} ({$variant->label}).",
                    ]);
                }

                $unitPrice = $variant->price();
                $lineTotal = bcmul($unitPrice, (string) $line['quantity'], 2);
                $total = bcadd($total, $lineTotal, 2);

                $prepared[] = [
                    'variant' => $variant,
                    'quantity' => $line['quantity'],
                    'unit_price' => $unitPrice,
                    'line_total' => $lineTotal,
                ];
            }

            $order = ProductOrder::query()->create([
                'user_id' => $user->id,
                'status' => ProductOrderStatus::Confirmed,
                'code' => ProductOrder::generateCode(),
                'total' => $total,
                'requires_shipping' => $requiresShipping,
                'shipping_name' => $requiresShipping ? $shipping['shipping_name'] : null,
                'shipping_line1' => $requiresShipping ? $shipping['shipping_line1'] : null,
                'shipping_line2' => $requiresShipping ? ($shipping['shipping_line2'] ?? null) : null,
                'shipping_city' => $requiresShipping ? $shipping['shipping_city'] : null,
                'shipping_postcode' => $requiresShipping ? $shipping['shipping_postcode'] : null,
                'shipping_country' => $requiresShipping ? strtoupper($shipping['shipping_country'] ?? 'GB') : null,
                'confirmed_at' => now(),
            ]);

            foreach ($prepared as $item) {
                /** @var ProductVariant $variant */
                $variant = $item['variant'];

                ProductOrderItem::query()->create([
                    'product_order_id' => $order->id,
                    'product_id' => $variant->product_id,
                    'product_variant_id' => $variant->id,
                    'name' => $variant->product->name,
                    'variant_label' => $variant->label,
                    'product_type' => $variant->product->product_type,
                    'unit_price' => $item['unit_price'],
                    'quantity' => $item['quantity'],
                    'line_total' => $item['line_total'],
                ]);

                if ($variant->stock !== null) {
                    $variant->decrement('stock', $item['quantity']);
                }
            }

            $this->cart->clear();

            return $order->load('items');
        });
    }

    /**
     * @param  array<string, mixed>  $shipping
     */
    private function validateShipping(array $shipping): void
    {
        $missing = collect(['shipping_name', 'shipping_line1', 'shipping_city', 'shipping_postcode'])
            ->filter(fn (string $field): bool => blank($shipping[$field] ?? null));

        if ($missing->isNotEmpty()) {
            throw ValidationException::withMessages(
                $missing->mapWithKeys(fn (string $field): array => [$field => 'This field is required for physical items in your bag.'])->all(),
            );
        }
    }
}
