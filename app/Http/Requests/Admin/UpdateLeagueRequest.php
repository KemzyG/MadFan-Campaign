<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLeagueRequest extends FormRequest
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
        $leagueId = $this->route('league')?->id;

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'short' => ['sometimes', 'string', 'max:32', 'unique:leagues,short,'.$leagueId],
            'logo' => ['nullable', 'image', 'max:2048'],
            'remove_logo' => ['sometimes', 'boolean'],
        ];
    }
}
