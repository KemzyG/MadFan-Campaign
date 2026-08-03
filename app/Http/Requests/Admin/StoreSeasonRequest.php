<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreSeasonRequest extends FormRequest
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
        return [
            'code' => ['required', 'string', 'max:50', 'unique:seasons,code'],
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:draft,active,completed,archived'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'total_weeks' => ['nullable', 'integer', 'min:1'],
            'points_budget' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
