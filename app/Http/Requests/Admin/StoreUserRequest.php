<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
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
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', Password::defaults()],
            'username' => ['nullable', 'string', 'max:255', 'unique:users,username'],
            'fan_id' => ['nullable', 'string', 'max:50', 'unique:users,fan_id'],
            'country' => ['nullable', 'string', 'max:100'],
            'league' => ['nullable', 'string', 'max:100'],
            'club' => ['nullable', 'string', 'max:100'],
            'loyalty_tier_id' => ['nullable', 'exists:loyalty_tiers,id'],
            'role' => ['nullable', 'string', 'exists:roles,name'],
        ];
    }
}
