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
use Illuminate\Support\Str;

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

    /**
     * Resolve a channel for the dedicated thread route, where the inbox is derived
     * from the channel itself rather than passed in the URL.
     */
    public function resolveThreadChannel(User $user, ClubServer $server, string $key): ?Channel
    {
        $channel = Channel::query()
            ->when(
                ctype_digit($key),
                fn ($q) => $q->whereKey((int) $key),
                fn ($q) => $q->where('slug', $key)->where('club_server_id', $server->id),
            )
            ->first();

        if ($channel === null) {
            return null;
        }

        if ($channel->isClub()) {
            return (int) $channel->club_server_id === (int) $server->id ? $channel : null;
        }

        return $channel->hasMember($user) ? $channel : null;
    }

    public function inboxForChannel(Channel $channel): string
    {
        return match (true) {
            $channel->isDirect() => self::INBOX_FRIENDS,
            $channel->isGroup() => self::INBOX_GROUPS,
            default => self::INBOX_CLUB,
        };
    }

    public function threadHref(Channel $channel): string
    {
        $key = $channel->isClub() ? (string) $channel->slug : (string) $channel->id;

        return '/social/chat/thread/'.urlencode($key);
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
            ->with([
                'author:id,name,handle,fan_id,avatar_path,avatar_emoji',
                'replyTo:id,author_id,body',
                'replyTo.author:id,name',
            ])
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
        $replyTo = $message->replyTo;

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
            'reply_to' => $replyTo ? [
                'id' => $replyTo->id,
                'body' => Str::limit((string) $replyTo->body, 120),
                'author_name' => $replyTo->author?->name,
            ] : null,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function presentChannels(ClubServer $server, ?Channel $active, ?User $viewer = null): array
    {
        $server->channels->loadMissing(['messages' => fn ($q) => $q->latest('id')->limit(1)]);
        $server->loadMissing('club');

        // One fanbase per server, so the counts are computed once and shared by every channel row.
        $club = $server->club;
        $onlineFans = $club !== null ? User::where('favourite_club_id', $club->id)->online()->count() : 0;
        $totalFans = $club !== null ? User::where('favourite_club_id', $club->id)->count() : 0;

        return $server->channels->map(function (Channel $channel) use ($active, $viewer, $onlineFans, $totalFans): array {
            $preview = $channel->messages->first();

            return [
                'id' => $channel->id,
                'slug' => $channel->slug,
                'name' => $channel->name,
                'topic' => $channel->topic,
                'scope' => ChannelScope::Club->value,
                'is_read_only' => $channel->is_read_only,
                'is_active' => $active !== null && $channel->id === $active->id,
                'href' => $this->threadHref($channel),
                'online_count' => $onlineFans,
                'fan_count' => $totalFans,
                'last_message' => $preview ? [
                    'body' => $preview->body,
                    'created_at' => $preview->created_at?->toIso8601String(),
                    'is_mine' => $viewer !== null && (int) $preview->author_id === (int) $viewer->id,
                ] : null,
            ];
        })->values()->all();
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
                'href' => $this->threadHref($channel),
                'peer' => $peer ? [
                    'id' => $peer->id,
                    'name' => $peer->name,
                    'handle' => $peer->handle,
                    'avatar_url' => $peer->avatar_url,
                    'avatar_emoji' => $peer->avatar_emoji,
                    'is_online' => $peer->isOnline(),
                    'last_seen_at' => $peer->last_seen_at?->toIso8601String(),
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
            $onlineCount = $channel->memberships
                ->filter(fn ($membership) => $membership->user?->isOnline())
                ->count();

            return [
                'id' => $channel->id,
                'slug' => $channel->slug,
                'name' => $channel->name,
                'topic' => $memberCount.' members',
                'scope' => ChannelScope::Group->value,
                'is_read_only' => $channel->is_read_only,
                'is_active' => $active !== null && $channel->id === $active->id,
                'href' => $this->threadHref($channel),
                'member_count' => $memberCount,
                'online_count' => $onlineCount,
                'last_message' => $preview ? [
                    'body' => $preview->body,
                    'created_at' => $preview->created_at?->toIso8601String(),
                    'is_mine' => (int) $preview->author_id === (int) $viewer->id,
                ] : null,
            ];
        })->values()->all();
    }

    /**
     * Every conversation the viewer can open, newest first — the desktop chat rail.
     *
     * @return list<array<string, mixed>>
     */
    public function presentRail(User $viewer, int $limit = 16): array
    {
        $rows = [
            ...$this->presentDirectThreads($viewer, null),
            ...$this->presentGroupThreads($viewer, null),
        ];

        $viewer->loadMissing('favouriteClub');

        if ($viewer->favouriteClub !== null) {
            $rows = [
                ...$rows,
                ...$this->presentChannels($this->serverForClub($viewer->favouriteClub), null, $viewer),
            ];
        }

        // ISO 8601 stamps share one offset here, so a string compare is a time compare.
        usort($rows, fn (array $a, array $b): int => ($b['last_message']['created_at'] ?? '')
            <=> ($a['last_message']['created_at'] ?? ''));

        return array_slice($rows, 0, $limit);
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
            $channel->loadMissing(['memberships.user:id,name,handle,fan_id,avatar_path,avatar_emoji,last_seen_at']);
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
                'is_online' => $peer->isOnline(),
                'last_seen_at' => $peer->last_seen_at?->toIso8601String(),
            ] : null;
        }

        if ($channel->isGroup()) {
            $channel->loadMissing('memberships.user:id,last_seen_at');
            $memberCount = $channel->memberships->count();
            $onlineCount = $channel->memberships
                ->filter(fn ($membership) => $membership->user?->isOnline())
                ->count();
            $base['topic'] = $memberCount.' members';
            $base['member_count'] = $memberCount;
            $base['presence'] = ['scope' => 'group', 'online' => $onlineCount, 'total' => $memberCount];
        }

        if ($channel->isClub()) {
            $club = $channel->club();
            if ($club !== null) {
                $base['presence'] = [
                    'scope' => 'club',
                    'online' => User::where('favourite_club_id', $club->id)->online()->count(),
                    'total' => User::where('favourite_club_id', $club->id)->count(),
                ];
            }
        }

        return $base;
    }

    /**
     * Roster for the members modal: online first, last-seen on the rest. Fetched lazily
     * (only when the modal opens) so a large club fanbase costs nothing until then.
     *
     * @return array{scope: string, title: ?string, online_count: int, total_count: int, members: list<array<string, mixed>>}
     */
    public function presentMembers(Channel $channel, User $viewer): array
    {
        if ($channel->isDirect()) {
            $channel->loadMissing(['memberships.user:id,name,handle,fan_id,avatar_path,avatar_emoji,last_seen_at']);
            $peer = $channel->memberships
                ->first(fn ($membership) => (int) $membership->user_id !== (int) $viewer->id)
                ?->user;

            $members = $peer !== null ? [$this->presentMember($peer)] : [];

            return [
                'scope' => 'direct',
                'title' => null,
                'online_count' => $peer?->isOnline() ? 1 : 0,
                'total_count' => count($members),
                'members' => $members,
            ];
        }

        if ($channel->isGroup()) {
            $channel->loadMissing('memberships.user:id,name,handle,fan_id,avatar_path,avatar_emoji,last_seen_at');

            $users = $channel->memberships
                ->map(fn ($membership) => $membership->user)
                ->filter()
                ->sortBy(fn (User $u) => [$u->isOnline() ? 0 : 1, mb_strtolower((string) $u->name)])
                ->take(200)
                ->values();

            return [
                'scope' => 'group',
                'title' => 'Members',
                'online_count' => $users->filter(fn (User $u) => $u->isOnline())->count(),
                'total_count' => $channel->memberships->count(),
                'members' => $users->map(fn (User $u) => $this->presentMember($u))->all(),
            ];
        }

        // Club: bounded slice (online, then most-recently-seen) with exact counts.
        $club = $channel->club();

        if ($club === null) {
            return ['scope' => 'club', 'title' => 'Fans', 'online_count' => 0, 'total_count' => 0, 'members' => []];
        }

        $columns = ['id', 'name', 'handle', 'fan_id', 'avatar_path', 'avatar_emoji', 'last_seen_at'];
        $threshold = now()->subMinutes(User::ONLINE_WINDOW_MINUTES);

        $online = User::where('favourite_club_id', $club->id)
            ->online()
            ->orderBy('name')
            ->limit(80)
            ->get($columns);

        $offline = User::where('favourite_club_id', $club->id)
            ->where(fn ($q) => $q->whereNull('last_seen_at')->orWhere('last_seen_at', '<', $threshold))
            ->orderByDesc('last_seen_at')
            ->limit(80)
            ->get($columns);

        return [
            'scope' => 'club',
            'title' => 'Fans',
            'online_count' => User::where('favourite_club_id', $club->id)->online()->count(),
            'total_count' => User::where('favourite_club_id', $club->id)->count(),
            'members' => $online->concat($offline)->map(fn (User $u) => $this->presentMember($u))->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function presentMember(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'handle' => $user->handle,
            'avatar_url' => $user->avatar_url,
            'avatar_emoji' => $user->avatar_emoji,
            'is_online' => $user->isOnline(),
            'last_seen_at' => $user->last_seen_at?->toIso8601String(),
        ];
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
                'memberships.user:id,name,handle,fan_id,avatar_path,avatar_emoji,last_seen_at',
                'messages' => fn ($q) => $q->latest('id')->limit(1),
            ])
            ->withMax('messages', 'id')
            ->orderByDesc('messages_max_id')
            ->orderByDesc('id')
            ->get();
    }
}
