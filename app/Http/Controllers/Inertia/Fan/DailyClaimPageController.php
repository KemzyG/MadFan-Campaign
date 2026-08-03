<?php

namespace App\Http\Controllers\Inertia\Fan;

use App\Actions\AwardPenaltyShootoutPoints;
use App\Http\Controllers\Controller;
use App\Http\Controllers\DailyClaimController;
use App\Http\Requests\AwardPenaltyShootoutBulkRequest;
use App\Http\Requests\AwardPenaltyShootoutPointsRequest;
use App\Http\Requests\DailyClaimRequest;
use App\Http\Requests\RecordPenaltyShootoutLossRequest;
use App\Services\Fan\FanPageDataService;
use App\Support\ApplicationSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DailyClaimPageController extends Controller
{
    public function index(Request $request, FanPageDataService $data): Response
    {
        $user = $request->user();

        return Inertia::render('Fan/DailyClaim', [
            ...$data->dailyClaim($request),
            'fan' => $data->userHeader($request),
            'shootout' => $user
                ? AwardPenaltyShootoutPoints::statusFor($user)
                : [
                    'active' => false,
                    'window_earned' => 0,
                    'window_limit' => AwardPenaltyShootoutPoints::windowLimit(),
                    'cooldown_until' => null,
                    'cooldown_seconds' => 0,
                    'cooldown_minutes' => AwardPenaltyShootoutPoints::cooldownMinutes(),
                    'corner_bonus_enabled' => ApplicationSettings::shootoutCornerBonusEnabled(),
                    'min_seconds_between' => AwardPenaltyShootoutPoints::minSecondsBetween(),
                    'earned_today' => 0,
                    'wins_today' => 0,
                    'losses_today' => 0,
                ],
        ]);
    }

    public function claim(DailyClaimRequest $request): RedirectResponse
    {
        $response = app(DailyClaimController::class)->claim($request);

        // Already claimed / conflict: still return to the pitch so free-play continues.
        if ($response->getStatusCode() >= 400) {
            return redirect()
                ->route('fan.daily-claim')
                ->with('error', $response->getData(true)['message'] ?? 'Claim unavailable.');
        }

        return redirect()->route('fan.daily-claim')->with('success', 'Daily claim successful!');
    }

    /**
     * Credit zone points (+1 / +3) from a shootout win into the fan balance.
     */
    public function shootoutWin(
        AwardPenaltyShootoutPointsRequest $request,
        AwardPenaltyShootoutPoints $award,
    ): JsonResponse {
        $result = $award->handle(
            $request->user(),
            $request->string('idempotency_key')->toString(),
            $request->zone(),
        );

        return response()->json($result);
    }

    /**
     * Credit a locally buffered batch of shootout awards / losses.
     */
    public function shootoutBulk(
        AwardPenaltyShootoutBulkRequest $request,
        AwardPenaltyShootoutPoints $award,
    ): JsonResponse {
        return response()->json($award->handleBulk(
            $request->user(),
            $request->awards(),
            $request->losses(),
        ));
    }

    /**
     * Record a save/miss toward today's shootout loss total.
     */
    public function shootoutLoss(
        RecordPenaltyShootoutLossRequest $request,
        AwardPenaltyShootoutPoints $award,
    ): JsonResponse {
        return response()->json($award->recordLoss($request->user()));
    }
}
