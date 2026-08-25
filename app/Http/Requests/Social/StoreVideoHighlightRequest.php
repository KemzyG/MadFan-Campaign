<?php

namespace App\Http\Requests\Social;

use App\Models\VideoHighlight;
use App\Services\Social\VideoHighlightService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreVideoHighlightRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', VideoHighlight::class) ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'video' => [
                'required',
                'file',
                'mimetypes:video/mp4,video/webm',
                'max:'.VideoHighlightService::MAX_UPLOAD_KB,
            ],
            'title' => ['nullable', 'string', 'max:120'],
            'caption' => ['nullable', 'string', 'max:'.VideoHighlightService::MAX_CAPTION_LENGTH],
            'duration_seconds' => [
                'nullable',
                'integer',
                'min:1',
                'max:'.VideoHighlightService::MAX_DURATION_SECONDS,
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'video.required' => 'Pick a short video to publish.',
            'video.mimetypes' => 'Use an mp4 or webm clip.',
            'video.max' => 'Keep reels under '.(int) (VideoHighlightService::MAX_UPLOAD_KB / 1024).'MB.',
            'duration_seconds.max' => 'Keep reels under '.VideoHighlightService::MAX_DURATION_SECONDS.' seconds.',
        ];
    }
}
