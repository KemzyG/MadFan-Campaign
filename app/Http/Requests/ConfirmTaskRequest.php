<?php

namespace App\Http\Requests;

use App\Models\Task;
use App\Models\UserTaskProgress;
use App\Support\TaskCompletionRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ConfirmTaskRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $task = $this->route('task');

        if (! $task instanceof Task) {
            return [
                'proof_url' => ['nullable', 'url', 'max:2048'],
                'proof_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
                'external_handle' => ['nullable', 'string', 'max:255'],
                'external_post_id' => ['nullable', 'string', 'max:255'],
                'verification_payload' => ['nullable', 'array'],
            ];
        }

        return TaskCompletionRules::inputRules($task, $this->user());
    }

    /**
     * @param  Validator  $validator
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $task = $this->route('task');

            if (! $task instanceof Task) {
                return;
            }

            $rules = TaskCompletionRules::forTask($task, $this->user());

            if ($rules['requires_handle']) {
                $handle = trim((string) ($this->input('external_handle') ?? $this->user()?->handle ?? ''));

                if ($handle === '') {
                    $validator->errors()->add(
                        'external_handle',
                        'Please enter your '.strtolower($rules['handle_label']).' to verify this task.',
                    );
                }
            }

            if (! $rules['requires_proof']) {
                return;
            }

            $proofUrl = trim((string) $this->input('proof_url', ''));
            $hasNewImage = $this->hasFile('proof_image');
            $hasExistingImage = false;

            if ($this->user() !== null) {
                $hasExistingImage = UserTaskProgress::query()
                    ->where('user_id', $this->user()->id)
                    ->where('task_id', $task->id)
                    ->whereNotNull('proof_image_path')
                    ->exists();
            }

            if ($proofUrl === '' && ! $hasNewImage && ! $hasExistingImage) {
                $validator->errors()->add(
                    'proof_url',
                    'Provide a proof URL (profile, post, or page) or upload a screenshot.',
                );
            }
        });
    }
}
