<?php

namespace App\Http\Requests\Social;

use App\Enums\StageSignalType;
use App\Models\Stage;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStageSignalRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Stage $stage */
        $stage = $this->route('stage');

        return $this->user()?->can('signal', $stage) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'to_user_id' => ['required', 'integer', 'exists:users,id'],
            'type' => ['required', 'string', Rule::enum(StageSignalType::class)],
            'payload' => ['required', 'array'],
        ];
    }
}
