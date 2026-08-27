<?php

namespace App\Http\Requests\LiveStage;

use App\Enums\LiveStageType;
use App\Models\LiveStage;
use App\Services\LiveStage\LiveStageService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLiveStageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', LiveStage::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'min:3', 'max:'.LiveStageService::MAX_TITLE_LENGTH],
            'type' => ['required', Rule::enum(LiveStageType::class)],
            'description' => ['nullable', 'string', 'max:'.LiveStageService::MAX_DESCRIPTION_LENGTH],
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
            'title.required' => 'Give your live stage a title.',
            'title.min' => 'Title needs at least 3 characters.',
            'type.required' => 'Choose a stage format.',
        ];
    }
}
