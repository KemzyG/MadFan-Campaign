<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Social\ChatService;
use App\Support\SocialRealtime;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialChatController extends Controller
{
    public function __invoke(Request $request, ChatService $chatService): Response
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing('favouriteClub.league');

        $club = $user->favouriteClub;

        abort_if($club === null, 403);

        $inbox = $chatService->normalizeInbox($request->string('inbox')->toString() ?: null);
        $channelKey = $request->string('channel')->toString() ?: null;

        $server = $chatService->serverForClub($club);
        $channel = $chatService->resolveInboxChannel($user, $inbox, $channelKey);

        $channels = [];
        $threads = [];
        $friendCandidates = [];
        $groupCandidates = [];

        if ($inbox === ChatService::INBOX_CLUB) {
            $channel ??= $chatService->resolveChannel($server, $channelKey);
            $this->authorize('view', $channel);
            $channels = $chatService->presentChannels($server, $channel);
        } elseif ($inbox === ChatService::INBOX_FRIENDS) {
            $threads = $chatService->presentDirectThreads($user, $channel);
            $friendCandidates = $chatService->presentFriendCandidates($user);
            if ($channel !== null) {
                $this->authorize('view', $channel);
            }
        } else {
            $threads = $chatService->presentGroupThreads($user, $channel);
            $groupCandidates = $chatService->presentGroupCandidates($user);
            if ($channel !== null) {
                $this->authorize('view', $channel);
            }
        }

        $messages = $channel !== null
            ? $chatService->latestMessages($channel)
            : [];

        return Inertia::render('Social/Chat', [
            'inbox' => $inbox,
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
