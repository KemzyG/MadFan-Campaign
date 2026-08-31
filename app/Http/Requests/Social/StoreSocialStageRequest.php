<?php

namespace App\Http\Requests\Social;

use App\Enums\StageType;
use App\Models\Stage;
use App\Services\Social\StageMediaService;
use App\Services\Social\StageService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            // Camera broadcasting now lives entirely in the Live Stage feature
            // (see LiveStageController::store) — a Stage created through this
            // request is always Voice, regardless of what a caller sends.
            // Real enum(Video/Streaming) values are rejected outright rather
            // than silently downgraded, so a stale client finds out immediately.
            'type' => ['sometimes', Rule::in([StageType::Voice->value])],
            'description' => ['nullable', 'string', 'max:'.StageService::MAX_DESCRIPTION_LENGTH],
            'is_public' => ['sometimes', 'boolean'],
            'allow_invite' => ['sometimes', 'boolean'],
            'allow_chat' => ['sometimes', 'boolean'],
            'allow_speak_requests' => ['sometimes', 'boolean'],
            'max_speakers' => ['sometimes', 'integer', Rule::in(StageService::SEAT_OPTIONS)],
            'background_key' => ['sometimes', 'integer', Rule::in(app(StageMediaService::class)->backgroundKeys())],
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
            'background_key.in' => 'Pick one of the stage backgrounds.',
        ];
    }
}
