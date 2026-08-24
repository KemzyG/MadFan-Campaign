<?php

namespace App\Http\Requests\Social;

use App\Enums\PostVisibility;
use App\Enums\ReplyScope;
use App\Models\Post;
use App\Services\Social\FeedService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Validator;

class StoreSocialPostRequest extends FormRequest
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
            'body' => ['nullable', 'string', 'max:'.FeedService::MAX_BODY_LENGTH],
            'images' => ['nullable', 'array', 'max:'.FeedService::MAX_IMAGES],
            'images.*' => ['file', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
            'visibility' => ['nullable', new Enum(PostVisibility::class)],
            'reply_scope' => ['nullable', new Enum(ReplyScope::class)],
            'tagged' => ['nullable', 'array', 'max:10'],
            'tagged.*' => ['integer', 'exists:users,id'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $body = trim((string) $this->input('body', ''));
            $images = $this->file('images', []);

            if ($body === '' && blank($images)) {
                $validator->errors()->add('body', 'Write something or add an image.');
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'body.max' => 'Keep it to '.FeedService::MAX_BODY_LENGTH.' characters — terrace takes, not essays.',
            'images.max' => 'Up to '.FeedService::MAX_IMAGES.' images per post.',
        ];
    }
}
