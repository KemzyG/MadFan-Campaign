<?php

namespace App\Http\Requests\Social;

use App\Enums\PostVisibility;
use App\Enums\ReplyScope;
use App\Models\Post;
use App\Services\Social\FeedService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
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
            'images.*' => [
                'file',
                'mimetypes:image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm',
                'max:'.FeedService::MAX_VIDEO_KB,
            ],
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
            /** @var list<UploadedFile|null> $files */
            $files = array_values(array_filter($this->file('images', []) ?? []));

            if ($body === '' && $files === []) {
                $validator->errors()->add('body', 'Write something or add a photo or video.');
            }

            foreach ($files as $index => $file) {
                if (! $file instanceof UploadedFile) {
                    continue;
                }

                $mime = strtolower((string) $file->getMimeType());
                $isImage = str_starts_with($mime, 'image/');
                $isVideo = str_starts_with($mime, 'video/');

                if ($isImage && $file->getSize() > FeedService::MAX_IMAGE_KB * 1024) {
                    $validator->errors()->add(
                        "images.{$index}",
                        'Images must be under '.(int) (FeedService::MAX_IMAGE_KB / 1024).'MB.',
                    );
                }

                if ($isVideo && $file->getSize() > FeedService::MAX_VIDEO_KB * 1024) {
                    $validator->errors()->add(
                        "images.{$index}",
                        'Videos must be under '.(int) (FeedService::MAX_VIDEO_KB / 1024).'MB.',
                    );
                }
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
            'images.max' => 'Up to '.FeedService::MAX_IMAGES.' photos or videos per post.',
            'images.*.mimetypes' => 'Use jpg, png, webp, gif, mp4, or webm.',
        ];
    }
}
