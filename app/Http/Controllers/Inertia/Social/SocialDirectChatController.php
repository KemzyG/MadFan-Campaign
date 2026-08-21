<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Actions\Social\EnsureDirectChatChannel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Social\StoreDirectChatRequest;
use App\Models\User;
use App\Services\Social\ChatService;
use Illuminate\Http\RedirectResponse;

class SocialDirectChatController extends Controller
{
    public function store(
        StoreDirectChatRequest $request,
        EnsureDirectChatChannel $ensureDirectChatChannel,
        ChatService $chatService,
    ): RedirectResponse {
        /** @var User $viewer */
        $viewer = $request->user();
        $peer = User::query()->findOrFail((int) $request->validated('user_id'));

        $channel = $ensureDirectChatChannel->handle($viewer, $peer);

        $this->authorize('view', $channel);

        return redirect()->route(
            'social.chat',
            $chatService->chatQueryParams(ChatService::INBOX_FRIENDS, $channel),
        );
    }
}
