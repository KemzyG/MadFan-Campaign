<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Actions\Social\SendChatMessage;
use App\Http\Controllers\Controller;
use App\Http\Requests\Social\StoreChatMessageRequest;
use App\Models\Channel;
use Illuminate\Http\RedirectResponse;

class SocialChatMessageController extends Controller
{
    public function store(
        StoreChatMessageRequest $request,
        Channel $channel,
        SendChatMessage $sendChatMessage,
    ): RedirectResponse {
        $this->authorize('sendMessage', $channel);

        $sendChatMessage->handle(
            $request->user(),
            $channel,
            $request->validated(),
        );

        return redirect()
            ->route('social.chat', ['channel' => $channel->slug]);
    }
}
