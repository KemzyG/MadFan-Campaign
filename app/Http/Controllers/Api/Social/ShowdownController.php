<?php

namespace App\Http\Controllers\Api\Social;

use App\Http\Controllers\Controller;
use App\Models\Showdown;
use App\Models\User;
use App\Services\Social\ShowdownService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShowdownController extends Controller
{
    public function vote(Request $request, Showdown $showdown, ShowdownService $showdowns): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'side' => ['required', 'string', 'in:a,b'],
        ]);

        return response()->json([
            'showdown' => $showdowns->vote($user, $showdown, $validated['side']),
        ]);
    }
}
