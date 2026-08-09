<?php

namespace App\Http\Requests\Social;

use App\Models\Post;
use App\Services\Social\FeedService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreSocialReplyRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Post $post */
        $post = $this->route('post');

        return $this->user()?->can('reply', $post) ?? false;
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
