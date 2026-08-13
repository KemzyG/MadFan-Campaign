<?php

namespace App\Http\Requests\Shop;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutJerseyCartRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'shipping_name' => ['required', 'string', 'max:120'],
            'shipping_line1' => ['required', 'string', 'max:160'],
            'shipping_line2' => ['nullable', 'string', 'max:160'],
            'shipping_city' => ['required', 'string', 'max:100'],
            'shipping_postcode' => ['required', 'string', 'max:32'],
            'shipping_country' => ['nullable', 'string', 'size:2'],
        ];
    }

    /**
     * @return array{
     *     shipping_name: string,
     *     shipping_line1: string,
     *     shipping_line2: string|null,
     *     shipping_city: string,
     *     shipping_postcode: string,
     *     shipping_country: string
     * }
     */
    public function shipping(): array
    {
        /** @var array{
         *     shipping_name: string,
         *     shipping_line1: string,
         *     shipping_line2?: string|null,
         *     shipping_city: string,
         *     shipping_postcode: string,
         *     shipping_country?: string
         * } $data
         */
        $data = $this->validated();

        return [
            'shipping_name' => $data['shipping_name'],
            'shipping_line1' => $data['shipping_line1'],
            'shipping_line2' => $data['shipping_line2'] ?? null,
            'shipping_city' => $data['shipping_city'],
            'shipping_postcode' => $data['shipping_postcode'],
            'shipping_country' => strtoupper($data['shipping_country'] ?? 'GB'),
        ];
    }
}
