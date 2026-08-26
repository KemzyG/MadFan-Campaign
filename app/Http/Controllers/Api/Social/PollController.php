<?php

namespace App\Http\Controllers\Api\Social;

use App\Http\Controllers\Controller;
use App\Models\Poll;
use App\Models\User;
use App\Services\Social\PollService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PollController extends Controller
{
    public function vote(Request $request, Poll $poll, PollService $polls): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'option_id' => ['required', 'integer'],
        ]);

        $polls->vote($user, $poll, $validated['option_id']);

        return response()->json([
            'poll' => $polls->present($poll->fresh(), $user),
        ]);
    }
}
