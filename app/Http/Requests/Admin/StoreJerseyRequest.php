<?php

namespace App\Http\Requests\Admin;

use App\Enums\JerseySize;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJerseyRequest extends FormRequest
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
            'club_id' => ['nullable', 'integer', 'exists:clubs,id'],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:jerseys,slug'],
            'description' => ['nullable', 'string', 'max:5000'],
            'price' => ['required', 'numeric', 'min:0', 'max:99999.99'],
            'is_active' => ['sometimes', 'boolean'],
            'image' => ['nullable', 'image', 'max:2048'],
            'media_asset_ids' => ['sometimes', 'array', 'max:24'],
            'media_asset_ids.*' => ['integer', 'distinct', 'exists:media_assets,id'],
            'sync_gallery' => ['sometimes', 'boolean'],
            'variants' => ['required', 'array', 'min:1'],
            'variants.*.size' => ['required', 'string', Rule::in(JerseySize::values()), 'distinct'],
            'variants.*.stock' => ['required', 'integer', 'min:0', 'max:100000'],
            'variants.*.sku' => ['nullable', 'string', 'max:64', 'distinct'],
        ];
    }
}
