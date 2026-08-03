<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class AwardPenaltyShootoutPointsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'idempotency_key' => ['required', 'string', 'uuid', 'max:255'],
            'zone' => ['required', 'array'],
            'zone.col' => ['required', 'integer', 'min:0', 'max:2'],
            'zone.row' => ['required', 'integer', 'min:0', 'max:2'],
        ];
    }

    /**
     * @return array{col: int, row: int}
     */
    public function zone(): array
    {
        return [
            'col' => $this->integer('zone.col'),
            'row' => $this->integer('zone.row'),
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'message' => 'The given data was invalid.',
            'errors' => $validator->errors(),
        ], 422));
    }
}
