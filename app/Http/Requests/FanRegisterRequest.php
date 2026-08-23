<?php

namespace App\Http\Requests;

use App\Models\Club;
use App\Services\Fan\FanPageDataService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class FanRegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
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
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'club' => ['required', 'string', 'max:100', $this->clubRule()],
            'username' => ['required', 'string', 'min:3', 'max:50', 'regex:/^[a-zA-Z0-9_]+$/', 'unique:users,username'],
            'bio' => ['nullable', 'string', 'max:280'],
            'date_of_birth' => ['nullable', 'date', 'before:-13 years'],
            'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:2048'],
            'referrer_fan_id' => ['nullable', 'string', 'max:50'],
            'device_fingerprint' => $fingerprintRule,
        ];
    }

    /**
     * Allow either a known club or the "Other" fallback.
     */
    protected function clubRule(): ValidationRule
    {
        return new class implements ValidationRule
        {
            public function validate(string $attribute, mixed $value, \Closure $fail): void
            {
                if ($value === FanPageDataService::OTHER_CLUB) {
                    return;
                }

                if (! Club::query()->where('name', $value)->exists()) {
                    $fail('Pick a valid club from the list.');
                }
            }
        };
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Enter your display name to continue.',
            'email.required' => 'Enter your email address.',
            'email.email' => 'Enter a valid email address.',
            'email.unique' => 'Unable to create an account with this information. Enter campaign if you already have an account, or try another email.',
            'password.required' => 'Choose a password with at least 8 characters, including upper and lower case letters and a number.',
            'password.confirmed' => 'Passwords do not match. Check both fields.',
            'club.required' => 'Pick your club before continuing.',
            'username.required' => 'Choose a username.',
            'username.regex' => 'Usernames can only contain letters, numbers, and underscores.',
            'username.unique' => 'That username is taken. Try another.',
            'date_of_birth.before' => 'You must be at least 13 years old to register.',
            'device_fingerprint.required' => 'We could not verify this device. Refresh the page and try again.',
            'device_fingerprint.min' => 'We could not verify this device. Refresh the page and try again.',
        ];
    }
}
