<?php

namespace App\Http\Controllers\Inertia\LiveStage;

use App\Http\Controllers\Controller;
use App\Http\Requests\LiveStage\StoreLiveStageRequest;
use App\Models\LiveStage;
use App\Models\User;
use App\Services\LiveStage\LiveStageService;
use App\Support\LiveStage\LiveStageTypeConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LiveStageController extends Controller
{
    /**
     * "Live Now" discovery + the creation form (stage-type picker).
     */
    public function index(LiveStageService $stages): Response
    {
        $this->authorize('viewAny', LiveStage::class);

        return Inertia::render('Social/Live/Index', [
            'stages' => $stages->presentLiveNow(),
            'stage_types' => array_map(
                fn ($type) => ['value' => $type->value, ...LiveStageTypeConfig::for($type)],
                LiveStageTypeConfig::implemented(),
            ),
            'max_title_length' => LiveStageService::MAX_TITLE_LENGTH,
            'max_description_length' => LiveStageService::MAX_DESCRIPTION_LENGTH,
        ]);
    }

    public function store(StoreLiveStageRequest $request, LiveStageService $stages): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $stage = $stages->create($user, $request->validated());

        return redirect()->route('social.live.show', $stage);
    }

    /**
     * One route, two experiences: the payload's `is_host` flag is what the
     * Social/Live/Show.jsx page reads to render Studio vs Viewer — see
     * section 49 of the Live Stage spec ("detect stage type, then branch").
     */
    public function show(Request $request, LiveStage $liveStage, LiveStageService $stages): Response
    {
        $this->authorize('view', $liveStage);

        /** @var User|null $user */
        $user = $request->user();

        // A guest is never joined as a tracked viewer session — there's no
        // user_id to key the row on (see LiveStageService::activeSession).
        if ($liveStage->isLive() && $user !== null && ! $liveStage->isHost($user)) {
            $stages->join($liveStage, $user);
        }

        if ($liveStage->isLive()) {
            $stages->pruneStaleViewers($liveStage);
        }

        $liveStage = $liveStage->fresh();

        return Inertia::render('Social/Live/Show', [
            'stage' => $stages->presentStage($liveStage, $user),
            'comments' => $stages->presentRecentComments($liveStage),
        ]);
    }

    /**
     * Polling fallback room-state read (mirrors SocialStageController::room) —
     * used when Reverb is down or as the initial state refresh.
     */
    public function state(Request $request, LiveStage $liveStage, LiveStageService $stages): JsonResponse
    {
        $this->authorize('view', $liveStage);

        /** @var User|null $user */
        $user = $request->user();

        if ($liveStage->isLive()) {
            if ($stages->activeSession($liveStage, $user) !== null) {
                $stages->heartbeat($liveStage, $user);
            }
            $stages->pruneStaleViewers($liveStage);
        }

        $liveStage = $liveStage->fresh();

        return response()->json([
            'stage' => $stages->presentStage($liveStage, $user),
        ]);
    }
}
