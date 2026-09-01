<?php

namespace App\Http\Controllers\Api\Social;

use App\Actions\Social\ClearChatChannel;
use App\Actions\Social\UpdateChatChannelPreferences;
use App\Http\Controllers\Controller;
use App\Http\Requests\Social\UpdateChatChannelPreferencesRequest;
use App\Models\Channel;
use App\Services\Social\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatChannelPreferencesController extends Controller
{
    public function update(
        UpdateChatChannelPreferencesRequest $request,
        Channel $channel,
        UpdateChatChannelPreferences $updateChatChannelPreferences,
        ChatService $chatService,
    ): JsonResponse {
        $member = $updateChatChannelPreferences->handle(
            $request->user(),
            $channel,
            $request->preferences(),
        );

        return response()->json([
            'message' => 'Chat settings updated.',
            'data' => $chatService->presentChannelSettings($member),
        ]);
    }

    public function clear(
        Request $request,
        Channel $channel,
        ClearChatChannel $clearChatChannel,
        ChatService $chatService,
    ): JsonResponse {
        $this->authorize('view', $channel);

        $member = $clearChatChannel->handle($request->user(), $channel);

        return response()->json([
            'message' => 'Chat cleared on your device.',
            'data' => $chatService->presentChannelSettings($member),
        ]);
    }
}
