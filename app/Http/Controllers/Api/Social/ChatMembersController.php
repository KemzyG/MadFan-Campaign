<?php

namespace App\Http\Controllers\Api\Social;

use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Services\Social\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatMembersController extends Controller
{
    /**
     * Roster for the members modal, fetched client-side when the modal opens so a
     * large club fanbase is never loaded on the thread request itself.
     */
    public function __invoke(Request $request, Channel $channel, ChatService $chatService): JsonResponse
    {
        $this->authorize('view', $channel);

        return response()->json([
            'data' => $chatService->presentMembers($channel, $request->user()),
        ]);
    }
}
