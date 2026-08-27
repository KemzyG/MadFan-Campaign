<?php

namespace App\Http\Controllers\Inertia\LiveStage;

use App\Contracts\LiveStage\MediaProvider;
use App\Http\Controllers\Controller;
use App\Models\LiveStage;
use App\Models\User;
use App\Services\LiveStage\LiveStageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

class LiveStageMediaTokenController extends Controller
{
    public function __invoke(
        Request $request,
        LiveStage $liveStage,
        LiveStageService $stages,
        MediaProvider $provider,
    ): JsonResponse {
        $this->authorize('mediaToken', $liveStage);

        if (! $provider->credentialsPresent()) {
            throw new ServiceUnavailableHttpException(
                null,
                'LiveKit is not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET.',
            );
        }

        /** @var User $user */
        $user = $request->user();

        if (! $liveStage->isHost($user)) {
            $stages->heartbeat($liveStage, $user);
        }

        return response()->json($stages->issueMediaToken($liveStage, $user));
    }
}
