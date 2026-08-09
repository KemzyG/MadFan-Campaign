<?php

namespace App\Http\Requests\Social;

use App\Models\Channel;
use App\Services\Social\ChatService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreChatMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Channel|null $channel */
        $channel = $this->route('channel');

        if (! $channel instanceof Channel) {
            return false;
        }

        return $this->user()?->can('sendMessage', $channel) ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Channel $channel */
        $channel = $this->route('channel');

        return [
            'body' => ['required', 'string', 'max:'.ChatService::MAX_BODY_LENGTH],
            'reply_to_message_id' => [
                'nullable',
                'integer',
                Rule::exists('messages', 'id')
                    ->where(fn ($query) => $query
                        ->where('channel_id', $channel->id)
                        ->whereNull('deleted_at')),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'body.required' => 'Say something on the terrace.',
            'body.max' => 'Keep it to '.ChatService::MAX_BODY_LENGTH.' characters.',
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
