<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Actions\Social\SendChatMessage;
use App\Enums\ChannelScope;
use App\Http\Controllers\Controller;
use App\Http\Requests\Social\StoreChatMessageRequest;
use App\Models\Channel;
use App\Services\Social\ChatService;
use Illuminate\Http\RedirectResponse;

class SocialChatMessageController extends Controller
{
    public function store(
        StoreChatMessageRequest $request,
        Channel $channel,
        SendChatMessage $sendChatMessage,
        ChatService $chatService,
    ): RedirectResponse {
        $this->authorize('sendMessage', $channel);

        $sendChatMessage->handle(
            $request->user(),
            $channel,
            [
                ...$request->validated(),
                'attachment' => $request->file('attachment'),
            ],
        );

        $inbox = match ($channel->scope ?? ChannelScope::Club) {
            ChannelScope::Direct => ChatService::INBOX_FRIENDS,
            ChannelScope::Group => ChatService::INBOX_GROUPS,
            ChannelScope::Club => ChatService::INBOX_CLUB,
            ChannelScope::Fandom => ChatService::INBOX_FANDOM,
        };

        return redirect()
            ->route('social.chat', $chatService->chatQueryParams($inbox, $channel));
    }
}
