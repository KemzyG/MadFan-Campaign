<?php

namespace App\Http\Requests\Admin;

use App\Models\Fandom;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFandomRequest extends FormRequest
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
        /** @var Fandom $fandom */
        $fandom = $this->route('fandom');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                'alpha_dash',
                Rule::unique('fandoms', 'slug')->ignore($fandom->id),
            ],
            'description' => ['nullable', 'string', 'max:5000'],
            'is_active' => ['sometimes', 'boolean'],
            'group' => ['nullable', 'string', Rule::in(['sports', 'esports', 'music', 'books'])],
            'icon' => ['nullable', 'string', 'max:16'],
            'cover_image' => ['nullable', 'image', 'max:4096'],
            'remove_cover_image' => ['sometimes', 'boolean'],
        ];
    }
}
