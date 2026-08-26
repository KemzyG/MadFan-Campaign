<?php

namespace App\Http\Controllers\Api\Social;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Social\FandomDiscoveryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FandomSearchController extends Controller
{
    public function __invoke(Request $request, FandomDiscoveryService $discovery): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json(
            $discovery->search($request->string('q')->toString(), $user),
        );
    }
}
