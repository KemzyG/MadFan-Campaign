<?php

namespace App\Http\Requests\Social;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSocialProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Empty optional fields are ignored so partial updates (e.g. avatar only) work.
     */
    protected function prepareForValidation(): void
    {
        $payload = $this->all();

        foreach (['name', 'handle'] as $field) {
            if (array_key_exists($field, $payload) && ! filled($payload[$field])) {
                unset($payload[$field]);
            }
        }

        $this->replace($payload);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'handle' => [
                'sometimes',
                'string',
                'max:255',
                'regex:/^[A-Za-z0-9._\-]+$/',
                Rule::unique('users', 'handle')->ignore($this->user()?->id),
            ],
            'bio' => ['sometimes', 'nullable', 'string', 'max:280'],
            'avatar' => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'handle.regex' => 'Handles can only use letters, numbers, dots, underscores and hyphens.',
            'handle.unique' => 'That handle is already taken.',
        ];
    }
}
