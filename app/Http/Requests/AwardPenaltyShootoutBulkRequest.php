<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class AwardPenaltyShootoutBulkRequest extends FormRequest
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
            'awards' => ['nullable', 'array', 'max:40'],
            'awards.*.idempotency_key' => ['required', 'string', 'uuid', 'max:255'],
            'awards.*.occurred_at' => ['required', 'date'],
            'awards.*.zone' => ['required', 'array'],
            'awards.*.zone.col' => ['required', 'integer', 'min:0', 'max:2'],
            'awards.*.zone.row' => ['required', 'integer', 'min:0', 'max:2'],
            'losses' => ['nullable', 'array', 'max:40'],
            'losses.*.idempotency_key' => ['required', 'string', 'uuid', 'max:255'],
            'losses.*.occurred_at' => ['required', 'date'],
            'losses.*.result' => ['nullable', 'string', 'in:save,miss,post,crossbar'],
        ];
    }

    /**
     * @return list<array{idempotency_key: string, occurred_at: string, zone: array{col: int, row: int}}>
     */
    public function awards(): array
    {
        /** @var list<array<string, mixed>> $awards */
        $awards = $this->validated('awards') ?? [];

        return array_map(static fn (array $award): array => [
            'idempotency_key' => (string) $award['idempotency_key'],
            'occurred_at' => (string) $award['occurred_at'],
            'zone' => [
                'col' => (int) $award['zone']['col'],
                'row' => (int) $award['zone']['row'],
            ],
        ], $awards);
    }

    /**
     * @return list<array{idempotency_key: string, occurred_at: string, result: string}>
     */
    public function losses(): array
    {
        /** @var list<array<string, mixed>> $losses */
        $losses = $this->validated('losses') ?? [];

        return array_map(static fn (array $loss): array => [
            'idempotency_key' => (string) $loss['idempotency_key'],
            'occurred_at' => (string) $loss['occurred_at'],
            'result' => (string) ($loss['result'] ?? 'miss'),
        ], $losses);
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'message' => 'The given data was invalid.',
            'errors' => $validator->errors(),
        ], 422));
    }
}
