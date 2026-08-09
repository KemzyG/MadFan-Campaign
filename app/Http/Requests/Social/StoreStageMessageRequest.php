<?php

namespace App\Http\Requests\Social;

use App\Models\Stage;
use App\Services\Social\StageService;
use Illuminate\Foundation\Http\FormRequest;

class StoreStageMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Stage $stage */
        $stage = $this->route('stage');

        return $this->user()?->can('sendMessage', $stage) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'min:1', 'max:'.StageService::MAX_MESSAGE_LENGTH],
        ];
    }
}
