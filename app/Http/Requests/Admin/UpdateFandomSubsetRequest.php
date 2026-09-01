<?php

namespace App\Http\Requests\Admin;

use App\Models\FandomSubset;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFandomSubsetRequest extends FormRequest
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
        /** @var FandomSubset $subset */
        $subset = $this->route('subset');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                'alpha_dash',
                Rule::unique('fandom_subsets', 'slug')
                    ->where('fandom_id', $subset->fandom_id)
                    ->ignore($subset->id),
            ],
            'fan_count' => ['nullable', 'integer', 'min:0'],
            'is_trending' => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'image' => ['nullable', 'image', 'max:4096'],
            'remove_image' => ['sometimes', 'boolean'],
        ];
    }
}
