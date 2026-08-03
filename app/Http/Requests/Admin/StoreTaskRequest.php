<?php

namespace App\Http\Requests\Admin;

use App\Enums\StaffPosition;
use Illuminate\Foundation\Http\FormRequest;

class StoreTaskRequest extends FormRequest
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
            'season_id' => ['required', 'exists:seasons,id'],
            'season_week_id' => ['nullable', 'exists:season_weeks,id'],
            'code' => ['required', 'string', 'max:100', 'unique:tasks,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'points' => ['required', 'integer', 'min:0'],
            'platform' => ['nullable', 'string', 'max:50'],
            'task_type' => ['nullable', 'string', 'max:50'],
            'audience' => ['nullable', 'string', 'in:fan,staff'],
            'staff_position' => ['nullable', 'string', 'in:'.implode(',', StaffPosition::values())],
            'assigned_user_id' => ['nullable', 'exists:users,id'],
            'external_url' => ['nullable', 'url'],
            'verification_required' => ['boolean'],
            'is_active' => ['boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'steps' => ['sometimes', 'array'],
            'steps.*.description' => ['required_with:steps', 'string'],
            'steps.*.link_url' => ['nullable', 'url'],
            'steps.*.link_label' => ['nullable', 'string', 'max:100'],
        ];
    }
}
