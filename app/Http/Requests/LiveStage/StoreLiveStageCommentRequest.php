<?php

namespace App\Http\Requests\LiveStage;

use App\Models\LiveStage;
use App\Services\LiveStage\LiveStageService;
use Illuminate\Foundation\Http\FormRequest;

class StoreLiveStageCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var LiveStage $stage */
        $stage = $this->route('liveStage');

        return $this->user()?->can('comment', $stage) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'min:1', 'max:'.LiveStageService::MAX_COMMENT_LENGTH],
        ];
    }
}
