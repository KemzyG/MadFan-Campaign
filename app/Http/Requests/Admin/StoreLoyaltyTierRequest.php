<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreLoyaltyTierRequest extends FormRequest
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
            'code' => ['required', 'string', 'max:50', 'unique:loyalty_tiers,code'],
            'name' => ['required', 'string', 'max:255'],
            'min_points' => ['required', 'integer', 'min:0'],
            'max_points' => ['nullable', 'integer', 'gte:min_points'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
