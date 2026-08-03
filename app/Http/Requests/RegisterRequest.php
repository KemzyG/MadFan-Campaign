<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (! $this->filled('device_fingerprint') && $this->headers->has('X-Device-Fingerprint')) {
            $this->merge([
                'device_fingerprint' => (string) $this->header('X-Device-Fingerprint'),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $fingerprintRule = config('registration.require_fingerprint', true)
            ? ['required', 'string', 'min:16', 'max:128']
            : ['nullable', 'string', 'min:16', 'max:128'];

        return [
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'username' => ['required', 'string', 'min:3', 'max:50', 'unique:users,username'],
            'name' => ['required', 'string', 'max:255'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'referrer_fan_id' => ['nullable', 'string', 'max:50'],
            'device_fingerprint' => $fingerprintRule,
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.unique' => 'Unable to create an account with this information.',
            'username.unique' => 'Unable to create an account with this information.',
        ];
    }
}
