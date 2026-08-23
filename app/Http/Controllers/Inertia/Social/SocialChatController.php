<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Models\Club;
use App\Models\ClubServer;
use App\Models\User;
use App\Services\Social\ChatService;
use App\Support\SocialRealtime;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialChatController extends Controller
{
    /**
     * Conversation list. A legacy `?channel=` still opens the thread inline so
     * bookmarks and post-send redirects keep working.
     */
    public function index(Request $request, ChatService $chatService): Response
    {
        [$user, $club, $server] = $this->context($request, $chatService);

        $inbox = $chatService->normalizeInbox($request->string('inbox')->toString() ?: null);
        $channelKey = $request->string('channel')->toString() ?: null;

        $channel = $chatService->resolveInboxChannel($user, $inbox, $channelKey);

        if ($inbox === ChatService::INBOX_CLUB) {
            $channel ??= $chatService->resolveChannel($server, $channelKey);
        }

        return $this->renderChat(
            $chatService,
            $user,
            $club,
            $server,
            $inbox,
            $channel,
            $channelKey !== null ? 'thread' : 'list',
        );
    }

    /**
     * A single thread. The inbox is derived from the channel scope, so the URL
     * stays clean for every conversation type.
     */
    public function show(Request $request, ChatService $chatService, string $channelKey): Response
    {
        [$user, $club, $server] = $this->context($request, $chatService);

        $channel = $chatService->resolveThreadChannel($user, $server, $channelKey);

        abort_if($channel === null, 404);

        return $this->renderChat(
            $chatService,
            $user,
            $club,
            $server,
            $chatService->inboxForChannel($channel),
            $channel,
            'thread',
        );
    }

    /**
     * @return array{0: User, 1: Club, 2: ClubServer}
     */
    private function context(Request $request, ChatService $chatService): array
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing('favouriteClub.league');

        $club = $user->favouriteClub;

        abort_if($club === null, 403);

        return [$user, $club, $chatService->serverForClub($club)];
    }

    private function renderChat(
        ChatService $chatService,
        User $user,
        Club $club,
        ClubServer $server,
        string $inbox,
        ?Channel $channel,
        string $view,
    ): Response {
        $channels = [];
        $threads = [];
        $friendCandidates = [];
        $groupCandidates = [];

        if ($inbox === ChatService::INBOX_CLUB && $channel !== null) {
            $this->authorize('view', $channel);
            $channels = $chatService->presentChannels($server, $channel, $user);
        } elseif ($inbox === ChatService::INBOX_FRIENDS) {
            $threads = $chatService->presentDirectThreads($user, $channel);
            $friendCandidates = $chatService->presentFriendCandidates($user);
            if ($channel !== null) {
                $this->authorize('view', $channel);
            }
        } elseif ($inbox === ChatService::INBOX_GROUPS) {
            $threads = $chatService->presentGroupThreads($user, $channel);
            $groupCandidates = $chatService->presentGroupCandidates($user);
            if ($channel !== null) {
                $this->authorize('view', $channel);
            }
        }

        $messages = $channel !== null
            ? $chatService->latestMessages($channel)
            : [];

        return Inertia::render('Social/Chat/Index', [
            'inbox' => $inbox,
            'view' => $view,
            'club' => $chatService->presentClub($club),
            'server' => [
                'id' => $server->id,
                'name' => $server->name,
            ],
            'channels' => $channels,
            'threads' => $threads,
            'friend_candidates' => $friendCandidates,
            'group_candidates' => $groupCandidates,
            'channel' => $channel !== null
                ? $chatService->presentActiveChannel($channel, $user)
                : null,
            'messages' => [
                'items' => $chatService->presentMessages($messages, $user),
            ],
            'max_body_length' => ChatService::MAX_BODY_LENGTH,
            'poll_ms' => SocialRealtime::enabled()
                ? max(ChatService::POLL_INTERVAL_MS * 8, 30000)
                : ChatService::POLL_INTERVAL_MS,
            'realtime' => SocialRealtime::chatMeta(),
        ]);
    }
}
