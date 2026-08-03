<?php

namespace App\Http\Requests\Admin;

use App\Enums\StaffPosition;
use App\Enums\StaffStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AssignStaffPositionRequest extends FormRequest
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
            'staff_position' => ['required', Rule::enum(StaffPosition::class)],
            'staff_status' => ['nullable', Rule::enum(StaffStatus::class)],
        ];
    }
}
