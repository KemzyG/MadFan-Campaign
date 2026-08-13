<?php

namespace App\Services\Shop;

use App\Models\JerseyVariant;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Session;
use Illuminate\Validation\ValidationException;

class JerseyCart
{
    public const SESSION_KEY = 'jersey_cart';

    /**
     * @return array<int, array{variant_id: int, quantity: int}>
     */
    public function lines(): array
    {
        /** @var array<int, array{variant_id: int, quantity: int}> $lines */
        $lines = Session::get(self::SESSION_KEY, []);

        return array_values($lines);
    }

    public function count(): int
    {
        return collect($this->lines())->sum('quantity');
    }

    public function add(int $variantId, int $quantity = 1): void
    {
        if ($quantity < 1) {
            throw ValidationException::withMessages([
                'quantity' => 'Quantity must be at least 1.',
            ]);
        }

        $variant = JerseyVariant::query()->with('jersey')->findOrFail($variantId);

        if (! $variant->jersey?->is_active) {
            throw ValidationException::withMessages([
                'variant' => 'This jersey is not available.',
            ]);
        }

        $lines = collect($this->lines())->keyBy('variant_id');
        $existingQty = (int) ($lines->get($variantId)['quantity'] ?? 0);
        $nextQty = $existingQty + $quantity;

        if (! $variant->isInStock($nextQty)) {
            throw ValidationException::withMessages([
                'quantity' => 'Not enough stock for that size.',
            ]);
        }

        $lines->put($variantId, [
            'variant_id' => $variantId,
            'quantity' => $nextQty,
        ]);

        $this->store($lines);
    }

    public function update(int $variantId, int $quantity): void
    {
        if ($quantity < 1) {
            $this->remove($variantId);

            return;
        }

        $variant = JerseyVariant::query()->with('jersey')->findOrFail($variantId);

        if (! $variant->jersey?->is_active) {
            throw ValidationException::withMessages([
                'variant' => 'This jersey is not available.',
            ]);
        }

        if (! $variant->isInStock($quantity)) {
            throw ValidationException::withMessages([
                'quantity' => 'Not enough stock for that size.',
            ]);
        }

        $lines = collect($this->lines())->keyBy('variant_id');
        $lines->put($variantId, [
            'variant_id' => $variantId,
            'quantity' => $quantity,
        ]);

        $this->store($lines);
    }

    public function remove(int $variantId): void
    {
        $lines = collect($this->lines())
            ->reject(fn (array $line): bool => (int) $line['variant_id'] === $variantId);

        $this->store($lines);
    }

    public function clear(): void
    {
        Session::forget(self::SESSION_KEY);
    }

    /**
     * @return Collection<int, array{variant: JerseyVariant, quantity: int, line_total: string}>
     */
    public function resolvedLines(): Collection
    {
        $lines = $this->lines();

        if ($lines === []) {
            return collect();
        }

        $variants = JerseyVariant::query()
            ->with(['jersey.club:id,name,short,logo'])
            ->whereIn('id', array_column($lines, 'variant_id'))
            ->get()
            ->keyBy('id');

        return collect($lines)
            ->map(function (array $line) use ($variants): ?array {
                $variant = $variants->get($line['variant_id']);

                if ($variant === null || $variant->jersey === null) {
                    return null;
                }

                $quantity = (int) $line['quantity'];
                $unit = (string) $variant->jersey->price;
                $lineTotal = bcmul($unit, (string) $quantity, 2);

                return [
                    'variant' => $variant,
                    'quantity' => $quantity,
                    'unit_price' => $unit,
                    'line_total' => $lineTotal,
                ];
            })
            ->filter()
            ->values();
    }

    public function total(): string
    {
        return $this->resolvedLines()
            ->reduce(fn (string $carry, array $line): string => bcadd($carry, $line['line_total'], 2), '0.00');
    }

    /**
     * @param  Collection<int|string, array{variant_id: int, quantity: int}>  $lines
     */
    private function store(Collection $lines): void
    {
        Session::put(self::SESSION_KEY, $lines->values()->all());
    }
}
