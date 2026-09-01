<?php

namespace App\Actions\Social;

use App\Enums\ChannelScope;
use App\Enums\MessageType;
use App\Events\Social\ClubChatMessageCreated;
use App\Models\Channel;
use App\Models\ClubMembership;
use App\Models\FandomFollow;
use App\Models\Message;
use App\Models\SocialNotification;
use App\Models\User;
use App\Services\Social\ChatService;
use App\Support\CloudinaryImageStorage;
use App\Support\SocialBroadcast;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SendChatMessage
{
    public function __construct(
        private AwardSocialPoints $awardSocialPoints,
        private ChatService $chatService,
        private CreateSocialNotification $notifications,
    ) {}

    /**
     * @param  array{body?: string|null, reply_to_message_id?: int|null, attachment?: UploadedFile|null}  $data
     */
    public function handle(User $author, Channel $channel, array $data): Message
    {
        $body = trim((string) ($data['body'] ?? ''));
        $attachment = $data['attachment'] ?? null;

        if ($body === '' && ! $attachment instanceof UploadedFile) {
            throw ValidationException::withMessages([
                'body' => 'Say something, or attach a photo or video.',
            ]);
        }

        if (mb_strlen($body) > ChatService::MAX_BODY_LENGTH) {
            throw ValidationException::withMessages([
                'body' => 'Keep it to '.ChatService::MAX_BODY_LENGTH.' characters.',
            ]);
        }

        if ($channel->is_read_only) {
            throw ValidationException::withMessages([
                'body' => 'This channel is read-only.',
            ]);
        }

        if ($channel->slowmode_seconds > 0) {
            $lastAt = Message::query()
                ->where('channel_id', $channel->id)
                ->where('author_id', $author->id)
                ->latest('id')
                ->value('created_at');

            if ($lastAt !== null && now()->diffInSeconds($lastAt) < $channel->slowmode_seconds) {
                throw ValidationException::withMessages([
                    'body' => 'Slowmode — wait a moment before the next shout.',
                ]);
            }
        }

        $replyToId = $data['reply_to_message_id'] ?? null;

        $message = DB::transaction(function () use ($author, $channel, $body, $replyToId, $attachment): Message {
            if ($replyToId !== null) {
                Message::query()
                    ->where('channel_id', $channel->id)
                    ->whereKey($replyToId)
                    ->firstOrFail();
            }

            $media = $this->storeAttachment($attachment, $channel);

            return Message::query()->create([
                'channel_id' => $channel->id,
                'author_id' => $author->id,
                'type' => match ($media['message_type'] ?? null) {
                    MessageType::Voice => MessageType::Voice,
                    MessageType::Attachment => MessageType::Attachment,
                    default => MessageType::Text,
                },
                'body' => $body !== '' ? $body : null,
                'media_path' => $media['path'] ?? null,
                'media_type' => $media['type'] ?? null,
                'media_width' => $media['width'] ?? null,
                'media_height' => $media['height'] ?? null,
                'reply_to_message_id' => $replyToId,
            ]);
        });

        $this->awardSocialPoints->forChat($author, $message->id, $body);

        $message->load([
            'author',
            'replyTo:id,author_id,body,type',
            'replyTo.author:id,name',
        ]);

        SocialBroadcast::try(fn () => ClubChatMessageCreated::dispatch($message));

        foreach ($this->recipientsFor($channel, $author) as $recipient) {
            if ($this->chatService->isChannelMuted($recipient, $channel)) {
                continue;
            }

            $this->notifications->notify(
                $recipient,
                $author,
                SocialNotification::TYPE_CHAT_MESSAGE,
                $message,
                [
                    'snippet' => $body !== ''
                        ? str($body)->limit(80)->toString()
                        : ($message->type === MessageType::Voice
                            ? 'Sent a voice note'
                            : ($message->media_type === 'video' ? 'Sent a video' : 'Sent a photo')),
                    'channel_name' => $channel->name,
                    // threadHref(), not the raw slug: a direct/group channel's
                    // slug only resolves inside its own club's server scope
                    // (see ChatService::resolveThreadChannel), so a bare slug
                    // 404s for those — the numeric-id variant it returns for
                    // non-club channels is what actually opens the thread.
                    'channel_href' => $this->chatService->threadHref($channel),
                ],
            );
        }

        return $message;
    }

    /**
     * Who to notify about a new message, excluding the author. Club/fandom
     * scoped channels have no `channel_members` rows (membership is implicit
     * via favourite_club_id/ClubMembership or favourite_fandom_id/FandomFollow
     * — see ChannelPolicy::belongsToClubChannel/belongsToFandomChannel);
     * direct/group channels use the real pivot.
     *
     * @return Collection<int, User>
     */
    private function recipientsFor(Channel $channel, User $author): Collection
    {
        if ($channel->scope === ChannelScope::Fandom) {
            $channel->loadMissing('fandomServer');
            $fandomId = $channel->fandomServer?->fandom_id;

            if ($fandomId === null) {
                return collect();
            }

            $memberIds = FandomFollow::query()->where('fandom_id', $fandomId)->pluck('user_id');

            return User::query()
                ->where('id', '!=', $author->id)
                ->where(function ($query) use ($fandomId, $memberIds): void {
                    $query->where('favourite_fandom_id', $fandomId)
                        ->orWhereIn('id', $memberIds);
                })
                ->get();
        }

        if ($channel->scope === ChannelScope::Club) {
            $channel->loadMissing('clubServer');
            $clubId = $channel->clubServer?->club_id;

            if ($clubId === null) {
                return collect();
            }

            $memberIds = ClubMembership::query()->where('club_id', $clubId)->pluck('user_id');

            return User::query()
                ->where('id', '!=', $author->id)
                ->where(function ($query) use ($clubId, $memberIds): void {
                    $query->where('favourite_club_id', $clubId)
                        ->orWhereIn('id', $memberIds);
                })
                ->get();
        }

        return $channel->members()->where('users.id', '!=', $author->id)->get(['users.id']);
    }

    /**
     * @return array{path: string, type: 'image'|'video'|'audio', width: ?int, height: ?int, message_type: MessageType}|null
     */
    private function storeAttachment(?UploadedFile $attachment, Channel $channel): ?array
    {
        if ($attachment === null) {
            return null;
        }

        $mime = strtolower((string) $attachment->getMimeType());
        $filename = strtolower((string) $attachment->getClientOriginalName());
        $isVoiceUpload = str_starts_with($filename, 'voice-');
        $isAudio = str_starts_with($mime, 'audio/') || $isVoiceUpload;
        $isVideo = str_starts_with($mime, 'video/') && ! $isAudio;
        $path = CloudinaryImageStorage::storeMedia($attachment, 'social/chat/'.$channel->id);

        $width = null;
        $height = null;

        if (! $isVideo && ! $isAudio) {
            $size = @getimagesize($attachment->getRealPath()) ?: [null, null];
            $width = $size[0] ?? null;
            $height = $size[1] ?? null;
        }

        return [
            'path' => $path,
            'type' => $isVideo ? 'video' : ($isAudio ? 'audio' : 'image'),
            'width' => $width,
            'height' => $height,
            'message_type' => $isAudio ? MessageType::Voice : MessageType::Attachment,
        ];
    }
}
