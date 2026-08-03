<?php

namespace App\Http\Requests;

use App\Models\Club;
use App\Services\Fan\FanPageDataService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePassportRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
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

        foreach (['name', 'handle', 'club', 'avatar_emoji'] as $field) {
            if (array_key_exists($field, $payload) && ! filled($payload[$field])) {
                unset($payload[$field]);
            }
        }

        $this->replace($payload);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'handle' => ['sometimes', 'string', 'max:255'],
            'club' => ['sometimes', 'string', 'max:255', $this->clubRule()],
            'avatar_emoji' => ['sometimes', 'nullable', 'string', 'max:255'],
            'avatar' => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:2048'],
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
}
