<?php

namespace App\Http\Requests\Social;

use App\Models\Post;
use App\Services\Social\FeedService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreSocialQuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Post::class) ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'min:1', 'max:'.FeedService::MAX_BODY_LENGTH],
        ];
    }
}
