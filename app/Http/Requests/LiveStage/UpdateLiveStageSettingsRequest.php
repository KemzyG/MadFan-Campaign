<?php

namespace App\Http\Requests\LiveStage;

use App\Services\LiveStage\LiveStageService;
use Illuminate\Foundation\Http\FormRequest;

class UpdateLiveStageSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('liveStage')) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'min:3', 'max:'.LiveStageService::MAX_TITLE_LENGTH],
            'description' => ['sometimes', 'nullable', 'string', 'max:'.LiveStageService::MAX_DESCRIPTION_LENGTH],
            'is_public' => ['sometimes', 'boolean'],
            'allow_comments' => ['sometimes', 'boolean'],
            'allow_reactions' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.min' => 'Title needs at least 3 characters.',
        ];
    }
}
