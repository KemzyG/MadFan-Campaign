<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClubRequest extends FormRequest
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
        $clubId = $this->route('club')?->id;
        $leagueId = $this->input('league_id') ?? $this->route('club')?->league_id;

        return [
            'league_id' => ['sometimes', 'integer', 'exists:leagues,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'short' => [
                'sometimes',
                'string',
                'max:32',
                Rule::unique('clubs', 'short')
                    ->where(fn ($query) => $query->where('league_id', $leagueId))
                    ->ignore($clubId),
            ],
            'logo' => ['nullable', 'image', 'max:2048'],
            'remove_logo' => ['sometimes', 'boolean'],
        ];
    }
}
