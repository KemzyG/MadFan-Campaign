<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
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
        $userId = $this->route('user')?->id;

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'unique:users,email,'.$userId],
            'password' => ['sometimes', 'nullable', Password::defaults()],
            'username' => ['sometimes', 'nullable', 'string', 'max:255', 'unique:users,username,'.$userId],
            'handle' => ['sometimes', 'nullable', 'string', 'max:255'],
            'fan_id' => ['sometimes', 'nullable', 'string', 'max:50', 'unique:users,fan_id,'.$userId],
            'country' => ['sometimes', 'nullable', 'string', 'max:100'],
            'league' => ['sometimes', 'nullable', 'string', 'max:100'],
            'club' => ['sometimes', 'nullable', 'string', 'max:100'],
            'loyalty_tier_id' => ['sometimes', 'nullable', 'exists:loyalty_tiers,id'],
            'total_points' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
