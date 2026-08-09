<?php

namespace App\Http\Requests\Social;

use App\Models\Stage;
use App\Services\Social\StageService;
use Illuminate\Foundation\Http\FormRequest;

class StoreSocialStageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Stage::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'min:3', 'max:'.StageService::MAX_TITLE_LENGTH],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Give your Stage a title.',
            'title.min' => 'Title needs at least 3 characters.',
        ];
    }
}
