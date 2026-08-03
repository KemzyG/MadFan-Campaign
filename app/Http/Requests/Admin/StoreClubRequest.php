<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreClubRequest extends FormRequest
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
            'league_id' => ['required', 'integer', 'exists:leagues,id'],
            'name' => ['required', 'string', 'max:255'],
            'short' => [
                'required',
                'string',
                'max:32',
                Rule::unique('clubs', 'short')->where(
                    fn ($query) => $query->where('league_id', $this->integer('league_id')),
                ),
            ],
            'logo' => ['nullable', 'image', 'max:2048'],
        ];
    }
}
