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

        $server = $chatService->serverForClub($club);
        $channel = $chatService->resolveChannel($server, $request->string('channel')->toString() ?: null);

        $this->authorize('view', $channel);

        $messages = $chatService->latestMessages($channel);

        return Inertia::render('Social/Chat', [
            'club' => $chatService->presentClub($club),
            'server' => [
                'id' => $server->id,
                'name' => $server->name,
            ],
            'channels' => $chatService->presentChannels($server, $channel),
            'channel' => [
                'id' => $channel->id,
                'slug' => $channel->slug,
                'name' => $channel->name,
                'topic' => $channel->topic,
                'is_read_only' => $channel->is_read_only,
            ],
            'messages' => [
                'items' => $chatService->presentMessages($messages),
            ],
            'max_body_length' => ChatService::MAX_BODY_LENGTH,
            'poll_ms' => SocialRealtime::enabled()
                ? max(ChatService::POLL_INTERVAL_MS * 8, 30000)
                : ChatService::POLL_INTERVAL_MS,
            'realtime' => SocialRealtime::chatMeta(),
        ]);
    }
}
