<?php

namespace App\Http\Controllers\Api\Social;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Social\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatRailController extends Controller
{
    /**
     * Conversations for the desktop chat rail. Fetched client-side so phones,
     * which never render the rail, pay nothing for it.
     */
    public function __invoke(Request $request, ChatService $chatService): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'data' => $chatService->presentRail($user),
        ]);
    }
}
