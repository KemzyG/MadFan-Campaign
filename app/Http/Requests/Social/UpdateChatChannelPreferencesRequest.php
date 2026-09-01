<?php

namespace App\Http\Requests\Social;

use App\Models\Channel;
use App\Services\Social\ChatService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateChatChannelPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Channel|null $channel */
        $channel = $this->route('channel');

        return $channel instanceof Channel
            && $this->user()?->can('view', $channel);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'muted' => ['sometimes', 'boolean'],
            'archived' => ['sometimes', 'boolean'],
            'disappearing_seconds' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::in([
                    0,
                    ChatService::DISAPPEARING_DAY,
                    ChatService::DISAPPEARING_WEEK,
                    ChatService::DISAPPEARING_NINETY_DAYS,
                ]),
            ],
        ];
    }

    /**
     * @return array{muted?: bool, archived?: bool, disappearing_seconds?: int|null}
     */
    public function preferences(): array
    {
        $validated = $this->validated();
        $preferences = [];

        if (array_key_exists('muted', $validated)) {
            $preferences['muted'] = (bool) $validated['muted'];
        }

        if (array_key_exists('archived', $validated)) {
            $preferences['archived'] = (bool) $validated['archived'];
        }

        if (array_key_exists('disappearing_seconds', $validated)) {
            $seconds = $validated['disappearing_seconds'];
            $preferences['disappearing_seconds'] = $seconds === 0 ? null : $seconds;
        }

        return $preferences;
    }
}
