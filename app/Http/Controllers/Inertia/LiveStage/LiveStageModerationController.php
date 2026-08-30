<?php

namespace App\Http\Controllers\Inertia\LiveStage;

use App\Http\Controllers\Controller;
use App\Models\LiveStage;
use App\Models\User;
use App\Services\LiveStage\LiveStageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LiveStageModerationController extends Controller
{
    /**
     * The host's Viewers panel roster — everyone currently in the stage,
     * with enough on each row (mute state, join time) to act on immediately
     * via mute()/remove() below without a separate lookup.
     */
    public function viewers(Request $request, LiveStage $liveStage, LiveStageService $stages): JsonResponse
    {
        $this->authorize('moderate', $liveStage);

        return response()->json([
            'viewers' => $stages->activeViewers($liveStage),
        ]);
    }

    public function mute(Request $request, LiveStage $liveStage, User $user, LiveStageService $stages): RedirectResponse
    {
        $this->authorize('moderate', $liveStage);

        $muted = (bool) $request->boolean('muted', true);

        /** @var User $actor */
        $actor = $request->user();
        $stages->muteViewer($liveStage, $actor, $user, $muted);

        return back();
    }

    public function remove(Request $request, LiveStage $liveStage, User $user, LiveStageService $stages): RedirectResponse
    {
        $this->authorize('moderate', $liveStage);

        $ban = (bool) $request->boolean('ban', false);

        /** @var User $actor */
        $actor = $request->user();
        $stages->removeViewer($liveStage, $actor, $user, $ban);

        return back();
    }
}
