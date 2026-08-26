<?php

namespace App\Http\Controllers\Api\Social;

use App\Http\Controllers\Controller;
use App\Models\Prediction;
use App\Models\User;
use App\Services\Social\PredictionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PredictionController extends Controller
{
    public function vote(Request $request, Prediction $prediction, PredictionService $predictions): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'choice' => ['required', 'string', 'in:home,draw,away'],
        ]);

        $predictions->vote($user, $prediction, $validated['choice']);

        return response()->json([
            'prediction' => $predictions->present($prediction->fresh(), $user),
        ]);
    }
}
