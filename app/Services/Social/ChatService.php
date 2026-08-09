<?php

namespace App\Services\Social;

use App\Actions\Social\EnsureClubChatRooms;
use App\Models\Channel;
use App\Models\Club;
use App\Models\ClubServer;
use App\Models\Message;

class ChatService
{
    public const MAX_BODY_LENGTH = 500;

    public const MESSAGES_PER_PAGE = 50;

    public const POLL_INTERVAL_MS = 4000;

    public function __construct(
        private EnsureClubChatRooms $ensureClubChatRooms,
    ) {}

    public function serverForClub(Club $club): ClubServer
    {
        return $this->ensureClubChatRooms->handle($club);
    }

    public function resolveChannel(ClubServer $server, ?string $slug): Channel
    {
        $slug = $slug !== null && $slug !== '' ? $slug : 'general';

        $channel = $server->channels->firstWhere('slug', $slug)
            ?? $server->channels->firstWhere('slug', 'general')
            ?? $server->channels->first();

        if ($channel === null) {
            abort(404, 'No chat channels for this club yet.');
        }

        return $channel;
    }

    /**
     * Latest messages for a channel, chronological (oldest → newest in the window).
     *
     * @return list<Message>
     */
    public function latestMessages(Channel $channel, int $limit = self::MESSAGES_PER_PAGE): array
    {
        /** @var list<Message> $newestFirst */
        $newestFirst = Message::query()
            ->where('channel_id', $channel->id)
            ->with(['author:id,name,handle,fan_id,avatar_path,avatar_emoji'])
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->all();

        return array_reverse($newestFirst);
    }

    /**
     * @param  list<Message>  $messages
     * @return list<array<string, mixed>>
     */
    public function presentMessages(array $messages): array
    {
        return array_map(fn (Message $message): array => $this->presentMessage($message), $messages);
    }

    /**
     * @return array<string, mixed>
     */
    public function presentMessage(Message $message): array
    {
        $author = $message->author;

        return [
            'id' => $message->id,
            'body' => $message->body,
            'type' => $message->type?->value ?? (string) $message->type,
            'created_at' => $message->created_at?->toIso8601String(),
            'edited_at' => $message->edited_at?->toIso8601String(),
            'author' => $author ? [
                'id' => $author->id,
                'name' => $author->name,
                'handle' => $author->handle,
                'fan_id' => $author->fan_id,
                'avatar_url' => $author->avatar_url,
                'avatar_emoji' => $author->avatar_emoji,
            ] : null,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function presentChannels(ClubServer $server, Channel $active): array
    {
        return $server->channels->map(fn (Channel $channel): array => [
            'id' => $channel->id,
            'slug' => $channel->slug,
            'name' => $channel->name,
            'topic' => $channel->topic,
            'is_read_only' => $channel->is_read_only,
            'is_active' => $channel->id === $active->id,
        ])->values()->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function presentClub(Club $club): array
    {
        $club->loadMissing('league');

        return [
            'id' => $club->id,
            'name' => $club->name,
            'short' => $club->short,
            'logo_url' => $club->logo_url,
            'league' => $club->league?->name,
        ];
    }
}
