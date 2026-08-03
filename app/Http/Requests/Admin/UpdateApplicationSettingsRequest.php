<?php

namespace App\Http\Requests\Admin;

use App\Enums\AdminPermission;
use App\Support\ApplicationSettings;
use Illuminate\Foundation\Http\FormRequest;

class UpdateApplicationSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can(AdminPermission::SettingsUpdate->value) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return ApplicationSettings::validationRules();
    }

    protected function prepareForValidation(): void
    {
        $payload = $this->all();

        foreach (ApplicationSettings::definitions() as $key => $definition) {
            if ($definition['type'] === 'boolean' && ! array_key_exists($key, $payload)) {
                $payload[$key] = false;
            }
        }

        $this->merge($payload);
    }
}
