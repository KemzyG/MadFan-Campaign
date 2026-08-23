<?php

namespace App\Http\Requests\Social;

use App\Services\Social\StageMediaService;
use App\Services\Social\StageService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSocialStageRequest extends FormRequest
{
    public function authorize(): bool
    {
        $stage = $this->route('stage');

        return $stage !== null && ($this->user()?->can('update', $stage) ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'min:3', 'max:'.StageService::MAX_TITLE_LENGTH],
            'description' => ['sometimes', 'nullable', 'string', 'max:'.StageService::MAX_DESCRIPTION_LENGTH],
            'is_public' => ['sometimes', 'boolean'],
            'allow_invite' => ['sometimes', 'boolean'],
            'allow_chat' => ['sometimes', 'boolean'],
            'allow_speak_requests' => ['sometimes', 'boolean'],
            'background_key' => ['sometimes', 'integer', Rule::in(app(StageMediaService::class)->backgroundKeys())],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.min' => 'Title needs at least 3 characters.',
            'background_key.in' => 'Pick one of the stage backgrounds.',
        ];
    }
}
