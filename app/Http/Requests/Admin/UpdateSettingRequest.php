<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingRequest extends FormRequest
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
            'settings' => ['sometimes', 'array'],
            'settings.*.key' => ['required_with:settings', 'string'],
            'settings.*.value' => ['nullable', 'string'],
            'settings.*.description' => ['nullable', 'string'],
            'settings.*.type' => ['nullable', 'in:text,boolean,integer,json'],
            'key' => ['sometimes', 'string'],
            'value' => ['sometimes', 'nullable', 'string'],
            'description' => ['sometimes', 'nullable', 'string'],
            'type' => ['sometimes', 'nullable', 'in:text,boolean,integer,json'],
        ];
    }
}
