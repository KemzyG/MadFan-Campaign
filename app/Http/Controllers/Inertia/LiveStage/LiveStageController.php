<?php

namespace App\Http\Controllers\Inertia\LiveStage;

use App\Http\Controllers\Controller;
use App\Http\Requests\LiveStage\StoreLiveStageRequest;
use App\Models\LiveStage;
use App\Models\User;
use App\Services\LiveStage\LiveStageService;
use App\Services\Social\StageMediaService;
use App\Services\Social\StageService;
use App\Support\LiveStage\LiveStageTypeConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LiveStageController extends Controller
{
    /**
     * "Live Now" discovery.
     */
    public function index(LiveStageService $stages): Response
    {
        $this->authorize('viewAny', LiveStage::class);

        return Inertia::render('Social/Live/Index', [
            'stages' => $stages->presentLiveNow(),
        ]);
    }

    /**
     * The "Go Live" form — its own page (not a modal) so it has a real URL
     * and back-button behaviour, and so /social/stage's "Go Live" button can
     * send a host here directly instead of duplicating the form. One page,
     * two formats: a host picks Camera Live (creates a LiveStage, submits to
     * LiveStageController::store) or Voice Room (creates a Stage, submits to
     * SocialStageController::store) — both creation endpoints are unchanged,
     * this just carries both formats' field data for the shared picker.
     */
    public function create(StageMediaService $stageMedia): Response
    {
        $this->authorize('create', LiveStage::class);

        return Inertia::render('Social/Live/Create', [
            'stage_types' => array_map(
                fn ($type) => ['value' => $type->value, ...LiveStageTypeConfig::for($type)],
                LiveStageTypeConfig::implemented(),
            ),
            'max_title_length' => LiveStageService::MAX_TITLE_LENGTH,
            'max_description_length' => LiveStageService::MAX_DESCRIPTION_LENGTH,
            'stage_max_title_length' => StageService::MAX_TITLE_LENGTH,
            'stage_max_description_length' => StageService::MAX_DESCRIPTION_LENGTH,
            'stage_backgrounds' => $stageMedia->presentBackgroundOptions(),
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
