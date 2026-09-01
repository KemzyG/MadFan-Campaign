<?php

namespace App\Services\Social;

use App\Actions\Social\EnsureClubChatRooms;
use App\Actions\Social\EnsureFandomChatRoom;
use App\Enums\ChannelScope;
use App\Enums\MessageType;
use App\Models\Channel;
use App\Models\ChannelMember;
use App\Models\Club;
use App\Models\ClubServer;
use App\Models\Fandom;
use App\Models\FandomFollow;
use App\Models\FandomServer;
use App\Models\Follow;
use App\Models\Message;
use App\Models\SocialNotification;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class ChatService
{
    public const MAX_BODY_LENGTH = 500;

    public const MESSAGES_PER_PAGE = 50;

    public const MAX_VOICE_KB = 5120;

    public const DISAPPEARING_DAY = 86_400;

    public const DISAPPEARING_WEEK = 604_800;

    public const DISAPPEARING_NINETY_DAYS = 7_776_000;

    public const EDIT_WINDOW_MINUTES = 5;

    public const POLL_INTERVAL_MS = 4000;

    // Legacy — favourite_club_id is no longer set during onboarding, so no
    // fan reaches this tab through the normal chat UI anymore. Kept only so
    // a direct link to an existing club channel still resolves for whoever
    // already has a club (see resolveInboxChannel/resolveThreadChannel).
    public const INBOX_CLUB = 'club';

    public const INBOX_FANDOM = 'fandom';

    public const INBOX_FRIENDS = 'friends';

    public const INBOX_GROUPS = 'groups';

    public function __construct(
        private EnsureClubChatRooms $ensureClubChatRooms,
        private EnsureFandomChatRoom $ensureFandomChatRoom,
    ) {}

    public function serverForClub(Club $club): ClubServer
    {
        return $this->ensureClubChatRooms->handle($club);
    }

    public function serverForFandom(Fandom $fandom): FandomServer
    {
        return $this->ensureFandomChatRoom->handle($fandom);
    }

    public function normalizeInbox(?string $inbox): string
    {
        // Friends is the landing segment: opening Chat with no ?inbox= (or an
        // unrecognised one) lands a fan on their direct messages, not the
        // fandom room. Explicit fandom/club/groups selections still pass through.
        return match ($inbox) {
            self::INBOX_FANDOM => self::INBOX_FANDOM,
            self::INBOX_CLUB => self::INBOX_CLUB,
            self::INBOX_GROUPS => self::INBOX_GROUPS,
            default => self::INBOX_FRIENDS,
        };
    }

    public function resolveChannel(ClubServer|FandomServer $server, ?string $slug): Channel
    {
        $slug = $slug !== null && $slug !== '' ? $slug : 'general';

        $channel = $server->channels->firstWhere('slug', $slug)
            ?? $server->channels->firstWhere('slug', 'general')
            ?? $server->channels->first();

        if ($channel === null) {
            abort(404, 'No chat channels here yet.');
        }

        return $channel;
    }

    public function resolveInboxChannel(User $user, string $inbox, ?string $channelKey): ?Channel
    {
        if ($inbox === self::INBOX_FANDOM) {
            $fandom = $user->favouriteFandom;
            if ($fandom === null) {
                return null;
            }

            return $this->resolveChannel($this->serverForFandom($fandom), $channelKey);
        }

        if ($inbox === self::INBOX_CLUB) {
            $club = $user->favouriteClub;
            if ($club === null) {
                return null;
            }

            return $this->resolveChannel($this->serverForClub($club), $channelKey);
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
     * from the channel itself rather than passed in the URL. $server is the
     * viewer's primary community server (fandom, or club for a legacy direct
     * link) — a slug-only key resolves against it; a numeric key can be any
     * channel the viewer is allowed into.
     */
    public function resolveThreadChannel(User $user, ClubServer|FandomServer $server, string $key): ?Channel
    {
        $serverColumn = $server instanceof FandomServer ? 'fandom_server_id' : 'club_server_id';

        $channel = Channel::query()
            ->when(
                ctype_digit($key),
                fn ($q) => $q->whereKey((int) $key),
                fn ($q) => $q->where('slug', $key)->where($serverColumn, $server->id),
            )
            ->first();

        if ($channel === null) {
            return null;
        }

        return $user->can('view', $channel) ? $channel : null;
    }

    public function inboxForChannel(Channel $channel): string
    {
        return match (true) {
            $channel->isDirect() => self::INBOX_FRIENDS,
            $channel->isGroup() => self::INBOX_GROUPS,
            $channel->isClub() => self::INBOX_CLUB,
            default => self::INBOX_FANDOM,
        };
    }

    public function threadHref(Channel $channel): string
    {
        // Slugs are only unique per-server, not globally — 'general' exists
        // once per fandom AND once per club, so only the legacy club scope
        // (a single well-known server per channel list) gets the pretty
        // slug URL; fandom joins direct/group in using the id, which is
        // always unambiguous.
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
            ->withTrashed()
            ->where('channel_id', $channel->id)
            ->with([
                'author:id,name,handle,fan_id,avatar_path,avatar_emoji',
                'replyTo:id,author_id,body,type',
                'replyTo.author:id,name',
            ])
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->all();

        return array_reverse($newestFirst);
    }

    /**
     * @return array{messages: list<Message>, has_more: bool, oldest_id: ?int}
     */
    public function paginatedMessages(Channel $channel, ?int $beforeId, int $limit = self::MESSAGES_PER_PAGE, ?User $viewer = null): array
    {
        $limit = max(1, min($limit, 100));

        $query = Message::query()
            ->withTrashed()
            ->where('channel_id', $channel->id)
            ->with([
                'author:id,name,handle,fan_id,avatar_path,avatar_emoji',
                'replyTo:id,author_id,body,type',
                'replyTo.author:id,name',
            ])
            ->orderByDesc('id');

        if ($viewer !== null) {
            $member = ChannelMember::query()
                ->where('channel_id', $channel->id)
                ->where('user_id', $viewer->id)
                ->first();

            if ($member?->cleared_before_at !== null) {
                $query->where('created_at', '>', $member->cleared_before_at);
            }

            if ($member?->disappearing_seconds !== null && $member->disappearing_seconds > 0) {
                $query->where('created_at', '>', now()->subSeconds($member->disappearing_seconds));
            }
        }

        if ($beforeId !== null) {
            $query->where('id', '<', $beforeId);
        }

        /** @var list<Message> $newestFirst */
        $newestFirst = $query->limit($limit + 1)->get()->all();
        $hasMore = count($newestFirst) > $limit;

        if ($hasMore) {
            array_pop($newestFirst);
        }

        $messages = array_reverse($newestFirst);
        $oldestId = $messages[0]->id ?? null;

        return [
            'messages' => $messages,
            'has_more' => $hasMore,
            'oldest_id' => $oldestId,
        ];
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
        if ($message->trashed()) {
            return [
                'id' => $message->id,
                'body' => null,
                'type' => $message->type?->value ?? (string) $message->type,
                'media' => null,
                'created_at' => $message->created_at?->toIso8601String(),
                'edited_at' => null,
                'deleted' => true,
                'is_mine' => $viewer !== null && (int) $message->author_id === (int) $viewer->id,
                'author' => null,
                'reply_to' => null,
                'can_edit' => false,
                'can_delete' => false,
            ];
        }

        $author = $message->author;
        $replyTo = $message->replyTo;

        return [
            'id' => $message->id,
            'body' => $message->body,
            'type' => $message->type?->value ?? (string) $message->type,
            'media' => $message->media_path ? [
                'url' => $message->media_url,
                'type' => $message->type === MessageType::Voice ? 'audio' : $message->media_type,
                'width' => $message->media_width,
                'height' => $message->media_height,
            ] : null,
            'created_at' => $message->created_at?->toIso8601String(),
            'edited_at' => $message->edited_at?->toIso8601String(),
            'deleted' => false,
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
                'type' => $replyTo->type?->value ?? (string) $replyTo->type,
            ] : null,
            'can_edit' => $viewer !== null && $viewer->can('update', $message),
            'can_delete' => $viewer !== null && $viewer->can('delete', $message),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function presentChannels(ClubServer|FandomServer $server, ?Channel $active, ?User $viewer = null): array
    {
        $server->channels->loadMissing(['messages' => fn ($q) => $q->latest('id')->limit(1)]);

        // One fanbase per server, so the counts are computed once and shared by every channel row.
        if ($server instanceof FandomServer) {
            $server->loadMissing('fandom');
            $fandom = $server->fandom;
            $onlineFans = $fandom !== null ? User::where('favourite_fandom_id', $fandom->id)->online()->count() : 0;
            $totalFans = $fandom !== null ? User::where('favourite_fandom_id', $fandom->id)->count() : 0;
            $scope = ChannelScope::Fandom->value;
        } else {
            $server->loadMissing('club');
            $club = $server->club;
            $onlineFans = $club !== null ? User::where('favourite_club_id', $club->id)->online()->count() : 0;
            $totalFans = $club !== null ? User::where('favourite_club_id', $club->id)->count() : 0;
            $scope = ChannelScope::Club->value;
        }

        $unreadMap = $viewer !== null ? $this->unreadCountsMap($viewer) : [];
        $archivedIds = $viewer !== null ? $this->archivedChannelIds($viewer) : collect();

        return $server->channels
            ->reject(fn (Channel $channel) => $archivedIds->contains($channel->id))
            ->sortByDesc(fn (Channel $channel) => $channel->messages->first()?->id ?? 0)
            ->values()
            ->map(function (Channel $channel) use ($active, $viewer, $onlineFans, $totalFans, $scope, $unreadMap): array {
                $preview = $channel->messages->first();

                return [
                    'id' => $channel->id,
                    'slug' => $channel->slug,
                    'name' => $channel->name,
                    'topic' => $channel->topic,
                    'scope' => $scope,
                    'is_read_only' => $channel->is_read_only,
                    'is_active' => $active !== null && $channel->id === $active->id,
                    'href' => $this->threadHref($channel),
                    'online_count' => $onlineFans,
                    'fan_count' => $totalFans,
                    'unread_count' => $unreadMap[$channel->id] ?? 0,
                    'last_message' => $preview ? [
                        'body' => $preview->body,
                        'type' => $preview->type?->value ?? (string) $preview->type,
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
        $unreadMap = $this->unreadCountsMap($viewer);

        return $channels->map(function (Channel $channel) use ($viewer, $active, $unreadMap): array {
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
                'unread_count' => $unreadMap[$channel->id] ?? 0,
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
                    'type' => $preview->type?->value ?? (string) $preview->type,
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
        $unreadMap = $this->unreadCountsMap($viewer);

        return $channels->map(function (Channel $channel) use ($viewer, $active, $unreadMap): array {
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
                'unread_count' => $unreadMap[$channel->id] ?? 0,
                'last_message' => $preview ? [
                    'body' => $preview->body,
                    'type' => $preview->type?->value ?? (string) $preview->type,
                    'created_at' => $preview->created_at?->toIso8601String(),
                    'is_mine' => (int) $preview->author_id === (int) $viewer->id,
                ] : null,
            ];
        })->values()->all();
    }

    /**
     * Stamp the viewer as caught up on a channel — called every time they load
     * a thread (including poll-driven partial reloads while it stays open), so
     * `last_read_at` tracks "the last moment they had this thread on screen."
     * Club channels have no membership row by default (see ChannelPolicy), so
     * this is also what first creates one for them.
     */
    public function markRead(User $viewer, Channel $channel): void
    {
        $member = $this->membershipFor($viewer, $channel);
        $member->last_read_at = now();
        $member->save();

        // Reading the thread itself doesn't touch the separate SocialNotification
        // row created per message (that's what feeds the bell badge) — without
        // this, a chat message the viewer has already read here would sit
        // "unread" in the bell forever, since nothing else ever clears it.
        SocialNotification::query()
            ->where('recipient_id', $viewer->id)
            ->where('type', SocialNotification::TYPE_CHAT_MESSAGE)
            ->where('notifiable_type', Message::class)
            ->whereIn('notifiable_id', Message::query()->select('id')->where('channel_id', $channel->id))
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    /**
     * Total unread messages across every channel the viewer can reach —
     * the nav bell's badge count.
     */
    public function unreadCount(User $viewer): int
    {
        return array_sum($this->unreadCountsByChannel($viewer));
    }

    /**
     * @return array<int, int> channel_id => unread count
     */
    public function unreadCountsMap(User $viewer): array
    {
        return $this->unreadCountsByChannel($viewer);
    }

    /**
     * @return array<int, int> channel_id => unread count
     */
    private function unreadCountsByChannel(User $viewer): array
    {
        $channelIds = collect();

        $viewer->loadMissing(['favouriteFandom', 'favouriteClub']);
        if ($viewer->favouriteFandom !== null) {
            $channelIds = $channelIds->merge($this->serverForFandom($viewer->favouriteFandom)->channels->pluck('id'));
        }

        $followedFandomIds = FandomFollow::query()
            ->where('user_id', $viewer->id)
            ->pluck('fandom_id');

        foreach ($followedFandomIds as $fandomId) {
            if ((int) $fandomId === (int) $viewer->favourite_fandom_id) {
                continue;
            }

            $fandom = Fandom::query()->find($fandomId);
            if ($fandom !== null) {
                $channelIds = $channelIds->merge($this->serverForFandom($fandom)->channels->pluck('id'));
            }
        }

        if ($viewer->favouriteClub !== null) {
            $channelIds = $channelIds->merge($this->serverForClub($viewer->favouriteClub)->channels->pluck('id'));
        }

        $channelIds = $channelIds
            ->merge(ChannelMember::query()->where('user_id', $viewer->id)->pluck('channel_id'))
            ->unique()
            ->values();

        if ($channelIds->isEmpty()) {
            return [];
        }

        $lastReadMap = ChannelMember::query()
            ->where('user_id', $viewer->id)
            ->whereIn('channel_id', $channelIds)
            ->pluck('last_read_at', 'channel_id');

        $counts = [];

        foreach ($channelIds as $channelId) {
            $lastReadAt = $lastReadMap[$channelId] ?? null;

            $counts[$channelId] = Message::query()
                ->where('channel_id', $channelId)
                ->where('author_id', '!=', $viewer->id)
                ->when($lastReadAt !== null, fn ($q) => $q->where('created_at', '>', $lastReadAt))
                ->count();
        }

        return $counts;
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

        $viewer->loadMissing(['favouriteFandom', 'favouriteClub']);

        if ($viewer->favouriteFandom !== null) {
            $rows = [
                ...$rows,
                ...$this->presentChannels($this->serverForFandom($viewer->favouriteFandom), null, $viewer),
            ];
        }

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
     * Shared with StageService for its own invite-candidate picker — anywhere
     * that needs "people the viewer is follow-connected to" reuses this
     * rather than re-deriving the union/exclude/onboarded-only logic.
     *
     * @param  list<int>  $excludeIds
     * @return list<array<string, mixed>>
     */
    public function presentFollowConnections(User $viewer, array $excludeIds, int $limit): array
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

        if ($channel->isFandom()) {
            $fandom = $channel->fandom();
            if ($fandom !== null) {
                $base['presence'] = [
                    'scope' => 'fandom',
                    'online' => User::where('favourite_fandom_id', $fandom->id)->online()->count(),
                    'total' => User::where('favourite_fandom_id', $fandom->id)->count(),
                ];
            }
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

        $member = ChannelMember::query()
            ->where('channel_id', $channel->id)
            ->where('user_id', $viewer->id)
            ->first();

        $base['settings'] = $this->presentChannelSettings($member);

        return $base;
    }

    public function membershipFor(User $viewer, Channel $channel): ChannelMember
    {
        return ChannelMember::query()->firstOrCreate(
            ['channel_id' => $channel->id, 'user_id' => $viewer->id],
            ['role' => 'member', 'joined_at' => now()],
        );
    }

    public function isChannelMuted(User $viewer, Channel $channel): bool
    {
        return ChannelMember::query()
            ->where('channel_id', $channel->id)
            ->where('user_id', $viewer->id)
            ->whereNotNull('muted_at')
            ->exists();
    }

    /**
     * @return Collection<int, int>
     */
    public function archivedChannelIds(User $viewer): Collection
    {
        return ChannelMember::query()
            ->where('user_id', $viewer->id)
            ->whereNotNull('archived_at')
            ->pluck('channel_id');
    }

    /**
     * @return array<string, mixed>
     */
    public function presentChannelSettings(?ChannelMember $member): array
    {
        if ($member === null) {
            return [
                'muted' => false,
                'archived' => false,
                'disappearing_seconds' => null,
                'cleared_before_at' => null,
            ];
        }

        return [
            'muted' => $member->muted_at !== null,
            'archived' => $member->archived_at !== null,
            'disappearing_seconds' => $member->disappearing_seconds,
            'cleared_before_at' => $member->cleared_before_at?->toIso8601String(),
        ];
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

        $columns = ['id', 'name', 'handle', 'fan_id', 'avatar_path', 'avatar_emoji', 'last_seen_at'];
        $threshold = now()->subMinutes(User::ONLINE_WINDOW_MINUTES);

        if ($channel->isFandom()) {
            $fandom = $channel->fandom();

            if ($fandom === null) {
                return ['scope' => 'fandom', 'title' => 'Fans', 'online_count' => 0, 'total_count' => 0, 'members' => []];
            }

            $online = User::where('favourite_fandom_id', $fandom->id)->online()->orderBy('name')->limit(80)->get($columns);
            $offline = User::where('favourite_fandom_id', $fandom->id)
                ->where(fn ($q) => $q->whereNull('last_seen_at')->orWhere('last_seen_at', '<', $threshold))
                ->orderByDesc('last_seen_at')
                ->limit(80)
                ->get($columns);

            return [
                'scope' => 'fandom',
                'title' => 'Fans',
                'online_count' => User::where('favourite_fandom_id', $fandom->id)->online()->count(),
                'total_count' => User::where('favourite_fandom_id', $fandom->id)->count(),
                'members' => $online->concat($offline)->map(fn (User $u) => $this->presentMember($u))->all(),
            ];
        }

        // Club (legacy): bounded slice (online, then most-recently-seen) with exact counts.
        $club = $channel->club();

        if ($club === null) {
            return ['scope' => 'club', 'title' => 'Fans', 'online_count' => 0, 'total_count' => 0, 'members' => []];
        }

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

    /**
     * @return array<string, mixed>
     */
    public function presentFandom(Fandom $fandom): array
    {
        return [
            'id' => $fandom->id,
            'name' => $fandom->name,
            'slug' => $fandom->slug,
            'icon' => $fandom->icon,
        ];
    }

    public function chatQueryParams(string $inbox, Channel $channel): array
    {
        if ($inbox === self::INBOX_FANDOM || $inbox === self::INBOX_CLUB) {
            return [
                'inbox' => $inbox,
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
            ->whereHas('memberships', fn ($q) => $q
                ->where('user_id', $viewer->id)
                ->whereNull('archived_at'))
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
