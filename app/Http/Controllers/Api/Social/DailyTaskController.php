<?php

namespace App\Http\Controllers\Api\Social;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Social\SocialDailyTaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DailyTaskController extends Controller
{
    public function show(Request $request, SocialDailyTaskService $tasks): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json(['today' => $tasks->today($user)]);
    }

    public function claim(Request $request, SocialDailyTaskService $tasks): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json(['today' => $tasks->claim($user)]);
    }
}
