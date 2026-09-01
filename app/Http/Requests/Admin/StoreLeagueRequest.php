<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeagueRequest extends FormRequest
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
            'fandom_id' => ['nullable', 'integer', 'exists:fandoms,id'],
            'name' => ['required', 'string', 'max:255'],
            'short' => ['required', 'string', 'max:32', 'unique:leagues,short'],
            'logo' => ['nullable', 'image', 'max:2048'],
        ];
    }
}
