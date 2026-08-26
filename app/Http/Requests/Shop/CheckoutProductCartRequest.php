<?php

namespace App\Http\Requests\Shop;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutProductCartRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Shipping fields are nullable here — a bag of only digital goods
     * (subscriptions, collectibles) never needs them. PlaceProductOrder
     * enforces "required if the bag has anything physical" itself, since
     * that depends on cart contents a form request can't see cleanly.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'shipping_name' => ['nullable', 'string', 'max:120'],
            'shipping_line1' => ['nullable', 'string', 'max:160'],
            'shipping_line2' => ['nullable', 'string', 'max:160'],
            'shipping_city' => ['nullable', 'string', 'max:100'],
            'shipping_postcode' => ['nullable', 'string', 'max:32'],
            'shipping_country' => ['nullable', 'string', 'size:2'],
        ];
    }

    /**
     * @return array{
     *     shipping_name: string|null,
     *     shipping_line1: string|null,
     *     shipping_line2: string|null,
     *     shipping_city: string|null,
     *     shipping_postcode: string|null,
     *     shipping_country: string|null
     * }
     */
    public function shipping(): array
    {
        $data = $this->validated();

        return [
            'shipping_name' => $data['shipping_name'] ?? null,
            'shipping_line1' => $data['shipping_line1'] ?? null,
            'shipping_line2' => $data['shipping_line2'] ?? null,
            'shipping_city' => $data['shipping_city'] ?? null,
            'shipping_postcode' => $data['shipping_postcode'] ?? null,
            'shipping_country' => $data['shipping_country'] ?? null,
        ];
    }
}
