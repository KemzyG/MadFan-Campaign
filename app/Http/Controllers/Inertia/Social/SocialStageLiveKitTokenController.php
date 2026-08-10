<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Http\Controllers\Controller;
use App\Models\Stage;
use App\Models\User;
use App\Services\Social\LiveKitTokenService;
use App\Services\Social\StageService;
use App\Support\StageVoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

class SocialStageLiveKitTokenController extends Controller
{
    public function __invoke(
        Request $request,
        Stage $stage,
        StageService $stages,
        LiveKitTokenService $tokens,
    ): JsonResponse {
        $this->authorize('livekitToken', $stage);

        if (! StageVoice::credentialsPresent()) {
            throw new ServiceUnavailableHttpException(
                null,
                'LiveKit is not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET.',
            );
        }

        /** @var User $user */
        $user = $request->user();
        $participant = $stages->activeParticipant($stage, $user);

        if ($participant === null) {
            abort(403);
        }

        $stages->heartbeat($stage, $user);

        return response()->json($tokens->issue($stage, $user, $participant));
    }
}
