<?php

namespace App\Http\Requests\Social;

use App\Models\Message;
use App\Services\Social\ChatService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateChatMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Message|null $message */
        $message = $this->route('message');

        return $message instanceof Message
            && ($this->user()?->can('update', $message) ?? false);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:'.ChatService::MAX_BODY_LENGTH],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('body')) {
            $this->merge([
                'body' => trim(strip_tags((string) $this->input('body'))),
            ]);
        }
    }
}
