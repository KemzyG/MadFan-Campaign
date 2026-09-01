<?php

namespace App\Http\Controllers\Api\Social;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserBlock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatBlockController extends Controller
{
    public function store(Request $request, User $user): JsonResponse
    {
        /** @var User $viewer */
        $viewer = $request->user();

        abort_if($viewer->id === $user->id, 422, 'You cannot block yourself.');

        UserBlock::query()->firstOrCreate([
            'blocker_id' => $viewer->id,
            'blocked_id' => $user->id,
        ]);

        return response()->json([
            'message' => 'Fan blocked.',
            'data' => ['user_id' => $user->id],
        ], 201);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        /** @var User $viewer */
        $viewer = $request->user();

        UserBlock::query()
            ->where('blocker_id', $viewer->id)
            ->where('blocked_id', $user->id)
            ->delete();

        return response()->json([
            'message' => 'Fan unblocked.',
            'data' => ['user_id' => $user->id],
        ]);
    }
}
