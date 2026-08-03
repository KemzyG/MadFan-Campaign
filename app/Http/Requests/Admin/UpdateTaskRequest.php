<?php

namespace App\Http\Requests\Admin;

use App\Enums\StaffPosition;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskRequest extends FormRequest
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
        $taskId = $this->route('task')?->id;

        return [
            'season_id' => ['sometimes', 'exists:seasons,id'],
            'season_week_id' => ['sometimes', 'nullable', 'exists:season_weeks,id'],
            'code' => ['sometimes', 'string', 'max:100', 'unique:tasks,code,'.$taskId],
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'points' => ['sometimes', 'integer', 'min:0'],
            'platform' => ['sometimes', 'nullable', 'string', 'max:50'],
            'task_type' => ['sometimes', 'nullable', 'string', 'max:50'],
            'audience' => ['sometimes', 'nullable', 'string', 'in:fan,staff'],
            'staff_position' => ['sometimes', 'nullable', 'string', 'in:'.implode(',', StaffPosition::values())],
            'assigned_user_id' => ['sometimes', 'nullable', 'exists:users,id'],
            'external_url' => ['sometimes', 'nullable', 'url'],
            'verification_required' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'display_order' => ['sometimes', 'integer', 'min:0'],
            'starts_at' => ['sometimes', 'nullable', 'date'],
            'ends_at' => ['sometimes', 'nullable', 'date'],
            'steps' => ['sometimes', 'array'],
            'steps.*.description' => ['required_with:steps', 'string'],
            'steps.*.link_url' => ['nullable', 'url'],
            'steps.*.link_label' => ['nullable', 'string', 'max:100'],
        ];
    }
}
