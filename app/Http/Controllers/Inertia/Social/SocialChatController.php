<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Models\Fandom;
use App\Models\FandomServer;
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
        [$user, $fandom, $server] = $this->context($request, $chatService);

        $inbox = $chatService->normalizeInbox($request->string('inbox')->toString() ?: null);
        $channelKey = $request->string('channel')->toString() ?: null;

        $channel = $chatService->resolveInboxChannel($user, $inbox, $channelKey);

        if ($inbox === ChatService::INBOX_FANDOM) {
            $channel ??= $chatService->resolveChannel($server, $channelKey);
        }

        return $this->renderChat(
            $chatService,
            $user,
            $fandom,
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
        [$user, $fandom, $server] = $this->context($request, $chatService);

        $channel = $chatService->resolveThreadChannel($user, $server, $channelKey);

        abort_if($channel === null, 404);

        return $this->renderChat(
            $chatService,
            $user,
            $fandom,
            $server,
            $chatService->inboxForChannel($channel),
            $channel,
            'thread',
        );
    }

    /**
     * Fandom is the mandatory anchor now (every onboarded user has one — see
     * EnsureSocialOnboarded) — favourite_club_id is no longer set during
     * onboarding, so gating this page on club the way it used to would 403
     * every new fan out of Chat entirely. A user who still has a legacy club
     * can reach it through `?inbox=club` — see renderChat().
     *
     * Also eagerly provisions the user's club server (not just fandom) when
     * they have one, same as this method always did pre-fandom: several
     * other reads (the unread badge, the chat rail) provision it
     * independently of which inbox tab is even open, so a bare
     * `/social/chat` visit provisioning only fandom and not club would be a
     * regression for anyone who still has a legacy club.
     *
     * @return array{0: User, 1: Fandom, 2: FandomServer}
     */
    private function context(Request $request, ChatService $chatService): array
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing(['favouriteFandom', 'favouriteClub']);

        $fandom = $user->favouriteFandom;

        abort_if($fandom === null, 403);

        if ($user->favouriteClub !== null) {
            $chatService->serverForClub($user->favouriteClub);
        }

        return [$user, $fandom, $chatService->serverForFandom($fandom)];
    }

    private function renderChat(
        ChatService $chatService,
        User $user,
        Fandom $fandom,
        FandomServer $server,
        string $inbox,
        ?Channel $channel,
        string $view,
    ): Response {
        $channels = [];
        $threads = [];
        $friendCandidates = [];
        $groupCandidates = [];
        $clubProp = null;

        if ($inbox === ChatService::INBOX_FANDOM && $channel !== null) {
            $this->authorize('view', $channel);
            $channels = $chatService->presentChannels($server, $channel, $user);
        } elseif ($inbox === ChatService::INBOX_CLUB) {
            // Legacy path — only reachable by a fan who still has
            // favourite_club_id set from before the fandom move.
            $user->loadMissing('favouriteClub.league');
            $club = $user->favouriteClub;
            abort_if($club === null, 404);
            $clubServer = $chatService->serverForClub($club);
            $clubProp = $chatService->presentClub($club);

            if ($channel !== null) {
                $this->authorize('view', $channel);
                $channels = $chatService->presentChannels($clubServer, $channel, $user);
            }
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

        if ($view === 'thread' && $channel !== null) {
            $chatService->markRead($user, $channel);
        }

        $messages = $channel !== null
            ? $chatService->latestMessages($channel)
            : [];

        return Inertia::render('Social/Chat/Index', [
            'inbox' => $inbox,
            'view' => $view,
            'fandom' => $chatService->presentFandom($fandom),
            'club' => $clubProp,
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
