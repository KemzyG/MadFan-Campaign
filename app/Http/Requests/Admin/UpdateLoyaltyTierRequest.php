<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLoyaltyTierRequest extends FormRequest
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
        $tierId = $this->route('loyalty_tier')?->id ?? $this->route('loyaltyTier')?->id;

        return [
            'code' => ['sometimes', 'string', 'max:50', 'unique:loyalty_tiers,code,'.$tierId],
            'name' => ['sometimes', 'string', 'max:255'],
            'min_points' => ['sometimes', 'integer', 'min:0'],
            'max_points' => ['sometimes', 'nullable', 'integer'],
            'display_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
