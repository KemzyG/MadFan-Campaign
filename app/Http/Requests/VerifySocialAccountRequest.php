<?php

namespace App\Http\Requests;

use App\Enums\SocialPlatform;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VerifySocialAccountRequest extends FormRequest
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
        return [
            'platform' => ['required', Rule::enum(SocialPlatform::class)],
            'identifier' => ['required', 'string', 'max:255'],
            'return_to' => ['nullable', 'string', Rule::in(['connect', 'passport', 'manage', 'onboarding', 'register'])],
        ];
    }
}
