<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFandomRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'alpha_dash', Rule::unique('fandoms', 'slug')],
            'description' => ['nullable', 'string', 'max:5000'],
            'is_active' => ['sometimes', 'boolean'],
            'group' => ['nullable', 'string', Rule::in(['sports', 'esports', 'music', 'books'])],
            'icon' => ['nullable', 'string', 'max:16'],
            'cover_image' => ['nullable', 'image', 'max:4096'],
        ];
    }
}
