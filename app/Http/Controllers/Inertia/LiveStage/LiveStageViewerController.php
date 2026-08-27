<?php

namespace App\Http\Controllers\Inertia\LiveStage;

use App\Http\Controllers\Controller;
use App\Models\LiveStage;
use App\Models\User;
use App\Services\LiveStage\LiveStageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LiveStageViewerController extends Controller
{
    public function leave(Request $request, LiveStage $liveStage, LiveStageService $stages): RedirectResponse
    {
        $this->authorize('leave', $liveStage);

        /** @var User $user */
        $user = $request->user();
        $stages->leave($liveStage, $user);

        return redirect()->route('social.live.index');
    }

    /**
     * Foreground presence ping — same shape as SocialStageController::heartbeat.
     */
    public function heartbeat(Request $request, LiveStage $liveStage, LiveStageService $stages): JsonResponse
    {
        $this->authorize('view', $liveStage);

        /** @var User $user */
        $user = $request->user();

        if ($liveStage->isLive() && $stages->activeSession($liveStage, $user) !== null) {
            $stages->heartbeat($liveStage, $user);
        }

        return response()->json(['ok' => true]);
    }
}
