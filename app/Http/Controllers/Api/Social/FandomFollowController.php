<?php

namespace App\Http\Controllers\Api\Social;

use App\Http\Controllers\Controller;
use App\Models\Fandom;
use App\Models\FandomFollow;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FandomFollowController extends Controller
{
    public function store(Request $request, Fandom $fandom): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        FandomFollow::query()->firstOrCreate([
            'user_id' => $user->id,
            'fandom_id' => $fandom->id,
        ]);

        return response()->json([
            'following' => true,
            'fan_count' => FandomFollow::query()->where('fandom_id', $fandom->id)->count(),
        ]);
    }

    public function destroy(Request $request, Fandom $fandom): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        FandomFollow::query()
            ->where('user_id', $user->id)
            ->where('fandom_id', $fandom->id)
            ->delete();

        return response()->json([
            'following' => false,
            'fan_count' => FandomFollow::query()->where('fandom_id', $fandom->id)->count(),
        ]);
    }
}
