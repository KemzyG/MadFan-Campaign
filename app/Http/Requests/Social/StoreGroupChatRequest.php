<?php

namespace App\Http\Requests\Social;

use Illuminate\Foundation\Http\FormRequest;

class StoreGroupChatRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:60'],
            'member_ids' => ['required', 'array', 'min:1', 'max:49'],
            'member_ids.*' => ['integer', 'distinct', 'exists:users,id'],
        ];
    }
}
