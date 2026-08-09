<?php

namespace App\Http\Requests\Social;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSocialReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', Rule::in(['spam', 'abuse', 'harassment', 'other'])],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
