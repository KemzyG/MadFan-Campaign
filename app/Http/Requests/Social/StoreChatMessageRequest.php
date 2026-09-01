<?php

namespace App\Http\Requests\Social;

use App\Models\Channel;
use App\Services\Social\ChatService;
use App\Services\Social\FeedService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreChatMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Channel|null $channel */
        $channel = $this->route('channel');

        if (! $channel instanceof Channel) {
            return false;
        }

        return $this->user()?->can('sendMessage', $channel) ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Channel $channel */
        $channel = $this->route('channel');

        return [
            // Not `required` — a message can be attachment-only. withValidator()
            // below enforces "body or attachment" the same way post creation does.
            'body' => ['nullable', 'string', 'max:'.ChatService::MAX_BODY_LENGTH],
            'attachment' => [
                'nullable',
                'file',
                'mimetypes:image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,audio/webm,audio/mp4,audio/mpeg,audio/ogg,audio/wav',
                'max:'.max(FeedService::MAX_VIDEO_KB, ChatService::MAX_VOICE_KB),
            ],
            'reply_to_message_id' => [
                'nullable',
                'integer',
                Rule::exists('messages', 'id')
                    ->where(fn ($query) => $query
                        ->where('channel_id', $channel->id)
                        ->whereNull('deleted_at')),
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $body = trim((string) $this->input('body', ''));
            $file = $this->file('attachment');

            if ($body === '' && ! $file instanceof UploadedFile) {
                $validator->errors()->add('body', 'Say something, or attach a photo or video.');

                return;
            }

            if (! $file instanceof UploadedFile) {
                return;
            }

            $mime = strtolower((string) $file->getMimeType());
            $filename = strtolower((string) $file->getClientOriginalName());
            $isVoiceUpload = str_starts_with($filename, 'voice-');
            $isImage = str_starts_with($mime, 'image/');
            $isAudio = str_starts_with($mime, 'audio/') || $isVoiceUpload;
            $isVideo = str_starts_with($mime, 'video/') && ! $isAudio;

            if ($isImage && $file->getSize() > FeedService::MAX_IMAGE_KB * 1024) {
                $validator->errors()->add(
                    'attachment',
                    'Images must be under '.(int) (FeedService::MAX_IMAGE_KB / 1024).'MB.',
                );
            }

            if ($isVideo && $file->getSize() > FeedService::MAX_VIDEO_KB * 1024) {
                $validator->errors()->add(
                    'attachment',
                    'Videos must be under '.(int) (FeedService::MAX_VIDEO_KB / 1024).'MB.',
                );
            }

            if ($isAudio && $file->getSize() > ChatService::MAX_VOICE_KB * 1024) {
                $validator->errors()->add(
                    'attachment',
                    'Voice notes must be under '.(int) (ChatService::MAX_VOICE_KB / 1024).'MB.',
                );
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'body.max' => 'Keep it to '.ChatService::MAX_BODY_LENGTH.' characters.',
            'attachment.mimetypes' => 'Use jpg, png, webp, gif, mp4, webm, or a voice note (webm/mp4/ogg).',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('body')) {
            $this->merge([
                'body' => trim(strip_tags((string) $this->input('body'))),
            ]);
        }
    }
}
