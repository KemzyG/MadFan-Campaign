<?php

namespace App\Actions\Social;

use App\Enums\ChannelScope;
use App\Enums\MessageType;
use App\Events\Social\ClubChatMessageCreated;
use App\Models\Channel;
use App\Models\ClubMembership;
use App\Models\Message;
use App\Models\SocialNotification;
use App\Models\User;
use App\Services\Social\ChatService;
use App\Support\SocialBroadcast;
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
     * @param  array{body: string, reply_to_message_id?: int|null}  $data
     */
    public function handle(User $author, Channel $channel, array $data): Message
    {
        $body = trim((string) ($data['body'] ?? ''));

        if ($body === '') {
            throw ValidationException::withMessages([
                'body' => 'Say something on the terrace.',
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

        $message = DB::transaction(function () use ($author, $channel, $body, $replyToId): Message {
            if ($replyToId !== null) {
                Message::query()
                    ->where('channel_id', $channel->id)
                    ->whereKey($replyToId)
                    ->firstOrFail();
            }

            return Message::query()->create([
                'channel_id' => $channel->id,
                'author_id' => $author->id,
                'type' => MessageType::Text,
                'body' => $body,
                'reply_to_message_id' => $replyToId,
            ]);
        });

        $this->awardSocialPoints->forChat($author, $message->id, $body);

        $message->load([
            'author',
            'replyTo:id,author_id,body',
            'replyTo.author:id,name',
        ]);

        SocialBroadcast::try(fn () => ClubChatMessageCreated::dispatch($message));

        foreach ($this->recipientsFor($channel, $author) as $recipient) {
            $this->notifications->notify(
                $recipient,
                $author,
                SocialNotification::TYPE_CHAT_MESSAGE,
                $message,
                [
                    'snippet' => str($body)->limit(80)->toString(),
                    'channel_name' => $channel->name,
                    'channel_slug' => $channel->slug,
                ],
            );
        }

        return $message;
    }

    /**
     * Who to notify about a new message, excluding the author. Club-scoped
     * channels have no `channel_members` rows (membership is implicit via
     * favourite_club_id/ClubMembership — see ChannelPolicy::belongsToClubChannel);
     * direct/group channels use the real pivot.
     *
     * @return Collection<int, User>
     */
    private function recipientsFor(Channel $channel, User $author): Collection
    {
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
}
