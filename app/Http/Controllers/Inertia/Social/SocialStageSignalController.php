<?php

namespace App\Http\Controllers\Inertia\Social;

use App\Enums\StageSignalType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Social\StoreStageSignalRequest;
use App\Models\Stage;
use App\Models\User;
use App\Services\Social\StageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SocialStageSignalController extends Controller
{
    public function index(Request $request, Stage $stage, StageService $stages): JsonResponse
    {
        $this->authorize('signal', $stage);

        /** @var User $user */
        $user = $request->user();
        $stages->heartbeat($stage, $user);

        return response()->json([
            'signals' => $stages->drainSignals($stage, $user),
        ]);
    }

    public function store(StoreStageSignalRequest $request, Stage $stage, StageService $stages): JsonResponse
    {
        $this->authorize('signal', $stage);

        /** @var User $from */
        $from = $request->user();
        $validated = $request->validated();

        $to = User::query()->findOrFail($validated['to_user_id']);
        $type = StageSignalType::from($validated['type']);

        $signal = $stages->storeSignal(
            $stage,
            $from,
            $to,
            $type,
            $validated['payload'],
        );

        return response()->json([
            'id' => $signal->id,
        ], 201);
    }
}
