<?php

namespace App\Http\Requests\Admin;

use App\Enums\StaffPosition;
use App\Enums\StaffStatus;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStaffMemberRequest extends FormRequest
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
            'user_id' => [
                'required',
                'exists:users,id',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $user = User::query()->find($value);

                    if ($user?->is_staff) {
                        $fail('This user already has a staff position. Update them instead.');
                    }
                },
            ],
            'staff_position' => ['required', Rule::enum(StaffPosition::class)],
            'staff_status' => ['nullable', Rule::enum(StaffStatus::class)],
        ];
    }
}
