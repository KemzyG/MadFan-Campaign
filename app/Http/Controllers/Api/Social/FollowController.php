<?php

namespace App\Http\Controllers\Api\Social;

use App\Http\Controllers\Controller;
use App\Models\Follow;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class FollowController extends Controller
{
    public function store(Request $request, User $user): JsonResponse
    {
        /** @var User $viewer */
        $viewer = $request->user();

        if ($viewer->id === $user->id) {
            throw ValidationException::withMessages([
                'user' => 'You cannot follow yourself.',
            ]);
        }

        Follow::query()->firstOrCreate(
            [
                'follower_id' => $viewer->id,
                'following_id' => $user->id,
            ],
            [
                'created_at' => now(),
            ],
        );

        return response()->json([
            'message' => 'Following '.$user->name.'.',
            'following' => true,
            'user_id' => $user->id,
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        /** @var User $viewer */
        $viewer = $request->user();

        Follow::query()
            ->where('follower_id', $viewer->id)
            ->where('following_id', $user->id)
            ->delete();

        return response()->json([
            'message' => 'Unfollowed '.$user->name.'.',
            'following' => false,
            'user_id' => $user->id,
        ]);
    }
}
