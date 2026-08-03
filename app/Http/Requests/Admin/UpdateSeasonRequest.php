<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSeasonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $seasonId = $this->route('season')?->id;

        return [
            'code' => ['sometimes', 'string', 'max:50', 'unique:seasons,code,'.$seasonId],
            'name' => ['sometimes', 'string', 'max:255'],
            'status' => ['sometimes', 'string', 'in:draft,active,completed,archived'],
            'starts_at' => ['sometimes', 'date'],
            'ends_at' => ['sometimes', 'date'],
            'total_weeks' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'points_budget' => ['sometimes', 'nullable', 'integer', 'min:0'],
        ];
    }
}
