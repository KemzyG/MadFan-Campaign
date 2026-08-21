<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Actions\Social\CreateGroupChatChannel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Social\StoreGroupChatRequest;
use App\Models\User;
use App\Services\Social\ChatService;
use Illuminate\Http\RedirectResponse;

class SocialGroupChatController extends Controller
{
    public function store(
        StoreGroupChatRequest $request,
        CreateGroupChatChannel $createGroupChatChannel,
        ChatService $chatService,
    ): RedirectResponse {
        /** @var User $creator */
        $creator = $request->user();
        $data = $request->validated();

        $channel = $createGroupChatChannel->handle(
            $creator,
            (string) $data['name'],
            array_map('intval', $data['member_ids'] ?? []),
        );

        $this->authorize('view', $channel);

        return redirect()->route(
            'social.chat',
            $chatService->chatQueryParams(ChatService::INBOX_GROUPS, $channel),
        );
    }
}
