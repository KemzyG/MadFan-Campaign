<?php

namespace App\Services\Social;

use App\Actions\Social\EnsureClubChatRooms;
use App\Enums\ChannelScope;
use App\Models\Channel;
use App\Models\ChannelMember;
use App\Models\Club;
use App\Models\ClubServer;
use App\Models\Follow;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Collection;

class ChatService
{
    public const MAX_BODY_LENGTH = 500;

    public const MESSAGES_PER_PAGE = 50;

    public const POLL_INTERVAL_MS = 4000;

    public const INBOX_CLUB = 'club';

    public const INBOX_FRIENDS = 'friends';

    public const INBOX_GROUPS = 'groups';

    public function __construct(
        private EnsureClubChatRooms $ensureClubChatRooms,
    ) {}

    public function serverForClub(Club $club): ClubServer
    {
        return $this->ensureClubChatRooms->handle($club);
    }

    public function normalizeInbox(?string $inbox): string
    {
        return match ($inbox) {
            self::INBOX_FRIENDS => self::INBOX_FRIENDS,
            self::INBOX_GROUPS => self::INBOX_GROUPS,
            default => self::INBOX_CLUB,
        };
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

    public function resolveInboxChannel(User $user, string $inbox, ?string $channelKey): ?Channel
    {
        if ($inbox === self::INBOX_CLUB) {
            $club = $user->favouriteClub;
            if ($club === null) {
                return null;
            }

            $server = $this->serverForClub($club);

            return $this->resolveChannel($server, $channelKey);
        }

        if ($channelKey === null || $channelKey === '') {
            return $this->defaultMemberChannel($user, $inbox);
        }

        $channel = Channel::query()
            ->when(
                ctype_digit($channelKey),
                fn ($q) => $q->whereKey((int) $channelKey),
                fn ($q) => $q->where('slug', $channelKey),
            )
            ->where('scope', $inbox === self::INBOX_FRIENDS ? ChannelScope::Direct : ChannelScope::Group)
            ->first();

        if ($channel === null || ! $channel->hasMember($user)) {
            return $this->defaultMemberChannel($user, $inbox);
        }

        return $channel;
    }

    private function defaultMemberChannel(User $user, string $inbox): ?Channel
    {
        $scope = $inbox === self::INBOX_FRIENDS ? ChannelScope::Direct : ChannelScope::Group;

        return Channel::query()
            ->where('scope', $scope)
            ->whereHas('memberships', fn ($q) => $q->where('user_id', $user->id))
            ->orderByDesc(
                Message::query()
                    ->select('id')
                    ->whereColumn('messages.channel_id', 'channels.id')
                    ->orderByDesc('id')
                    ->limit(1),
            )
            ->orderByDesc('id')
            ->first();
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
    public function presentMessages(array $messages, ?User $viewer = null): array
    {
        return array_map(
            fn (Message $message): array => $this->presentMessage($message, $viewer),
            $messages,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function presentMessage(Message $message, ?User $viewer = null): array
    {
        $author = $message->author;

        return [
            'id' => $message->id,
            'body' => $message->body,
            'type' => $message->type?->value ?? (string) $message->type,
            'created_at' => $message->created_at?->toIso8601String(),
            'edited_at' => $message->edited_at?->toIso8601String(),
            'is_mine' => $viewer !== null && (int) $message->author_id === (int) $viewer->id,
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
            'scope' => ChannelScope::Club->value,
            'is_read_only' => $channel->is_read_only,
            'is_active' => $channel->id === $active->id,
            'href' => '/social/chat?inbox=club&channel='.urlencode($channel->slug),
        ])->values()->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function presentDirectThreads(User $viewer, ?Channel $active): array
    {
        $channels = $this->memberChannels($viewer, ChannelScope::Direct);

        return $channels->map(function (Channel $channel) use ($viewer, $active): array {
            $peer = $channel->memberships
                ->first(fn ($membership) => (int) $membership->user_id !== (int) $viewer->id)
                ?->user;

            $preview = $channel->messages->first();

            return [
                'id' => $channel->id,
                'slug' => $channel->slug,
                'name' => $peer?->name ?? 'Fan',
                'topic' => $peer?->handle ? '@'.$peer->handle : null,
                'scope' => ChannelScope::Direct->value,
                'is_read_only' => $channel->is_read_only,
                'is_active' => $active !== null && $channel->id === $active->id,
                'href' => '/social/chat?inbox=friends&channel='.$channel->id,
                'peer' => $peer ? [
                    'id' => $peer->id,
                    'name' => $peer->name,
                    'handle' => $peer->handle,
                    'avatar_url' => $peer->avatar_url,
                    'avatar_emoji' => $peer->avatar_emoji,
                ] : null,
                'last_message' => $preview ? [
                    'body' => $preview->body,
                    'created_at' => $preview->created_at?->toIso8601String(),
                    'is_mine' => (int) $preview->author_id === (int) $viewer->id,
                ] : null,
            ];
        })->values()->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function presentGroupThreads(User $viewer, ?Channel $active): array
    {
        $channels = $this->memberChannels($viewer, ChannelScope::Group);

        return $channels->map(function (Channel $channel) use ($viewer, $active): array {
            $preview = $channel->messages->first();
            $memberCount = $channel->memberships->count();

            return [
                'id' => $channel->id,
                'slug' => $channel->slug,
                'name' => $channel->name,
                'topic' => $memberCount.' members',
                'scope' => ChannelScope::Group->value,
                'is_read_only' => $channel->is_read_only,
                'is_active' => $active !== null && $channel->id === $active->id,
                'href' => '/social/chat?inbox=groups&channel='.$channel->id,
                'member_count' => $memberCount,
                'last_message' => $preview ? [
                    'body' => $preview->body,
                    'created_at' => $preview->created_at?->toIso8601String(),
                    'is_mine' => (int) $preview->author_id === (int) $viewer->id,
                ] : null,
            ];
        })->values()->all();
    }

    /**
     * People the viewer can start a DM with (follow connection, no existing thread preferred first).
     *
     * @return list<array<string, mixed>>
     */
    public function presentFriendCandidates(User $viewer, int $limit = 40): array
    {
        $existingPeerIds = ChannelMember::query()
            ->whereIn(
                'channel_id',
                Channel::query()
                    ->select('id')
                    ->where('scope', ChannelScope::Direct)
                    ->whereHas('memberships', fn ($q) => $q->where('user_id', $viewer->id)),
            )
            ->where('user_id', '!=', $viewer->id)
            ->pluck('user_id')
            ->all();

        return $this->presentFollowConnections($viewer, $existingPeerIds, $limit);
    }

    /**
     * Friends eligible to add to a new group.
     *
     * @return list<array<string, mixed>>
     */
    public function presentGroupCandidates(User $viewer, int $limit = 60): array
    {
        return $this->presentFollowConnections($viewer, [], $limit);
    }

    /**
     * @param  list<int>  $excludeIds
     * @return list<array<string, mixed>>
     */
    private function presentFollowConnections(User $viewer, array $excludeIds, int $limit): array
    {
        $followingIds = Follow::query()
            ->where('follower_id', $viewer->id)
            ->pluck('following_id');

        $followerIds = Follow::query()
            ->where('following_id', $viewer->id)
            ->pluck('follower_id');

        $excludeLookup = array_fill_keys(array_map('intval', $excludeIds), true);

        $candidateIds = $followingIds->merge($followerIds)->unique()->values()
            ->reject(fn ($id) => isset($excludeLookup[(int) $id]) || (int) $id === (int) $viewer->id)
            ->take($limit)
            ->all();

        if ($candidateIds === []) {
            return [];
        }

        return User::query()
            ->whereIn('id', $candidateIds)
            ->whereNotNull('social_onboarded_at')
            ->orderBy('name')
            ->get(['id', 'name', 'handle', 'fan_id', 'avatar_path', 'avatar_emoji'])
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'handle' => $user->handle,
                'avatar_url' => $user->avatar_url,
                'avatar_emoji' => $user->avatar_emoji,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function presentActiveChannel(Channel $channel, User $viewer): array
    {
        $base = [
            'id' => $channel->id,
            'slug' => $channel->slug,
            'name' => $channel->name,
            'topic' => $channel->topic,
            'scope' => $channel->scope?->value ?? ChannelScope::Club->value,
            'is_read_only' => $channel->is_read_only,
        ];

        if ($channel->isDirect()) {
            $channel->loadMissing(['memberships.user:id,name,handle,fan_id,avatar_path,avatar_emoji']);
            $peer = $channel->memberships
                ->first(fn ($membership) => (int) $membership->user_id !== (int) $viewer->id)
                ?->user;

            $base['name'] = $peer?->name ?? 'Fan';
            $base['topic'] = $peer?->handle ? '@'.$peer->handle : null;
            $base['peer'] = $peer ? [
                'id' => $peer->id,
                'name' => $peer->name,
                'handle' => $peer->handle,
                'avatar_url' => $peer->avatar_url,
                'avatar_emoji' => $peer->avatar_emoji,
            ] : null;
        }

        if ($channel->isGroup()) {
            $channel->loadMissing('memberships');
            $base['topic'] = $channel->memberships->count().' members';
            $base['member_count'] = $channel->memberships->count();
        }

        return $base;
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

    public function chatQueryParams(string $inbox, Channel $channel): array
    {
        if ($inbox === self::INBOX_CLUB) {
            return [
                'inbox' => self::INBOX_CLUB,
                'channel' => $channel->slug,
            ];
        }

        return [
            'inbox' => $inbox,
            'channel' => (string) $channel->id,
        ];
    }

    /**
     * @return Collection<int, Channel>
     */
    private function memberChannels(User $viewer, ChannelScope $scope): Collection
    {
        return Channel::query()
            ->where('scope', $scope)
            ->whereHas('memberships', fn ($q) => $q->where('user_id', $viewer->id))
            ->with([
                'memberships.user:id,name,handle,fan_id,avatar_path,avatar_emoji',
                'messages' => fn ($q) => $q->latest('id')->limit(1),
            ])
            ->withMax('messages', 'id')
            ->orderByDesc('messages_max_id')
            ->orderByDesc('id')
            ->get();
    }
}
