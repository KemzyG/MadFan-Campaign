<?php

namespace App\Http\Controllers\Api\Social;

use App\Http\Controllers\Controller;
use App\Models\Stage;
use App\Models\User;
use App\Services\Social\StageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StageInviteCandidatesController extends Controller
{
    /**
     * Who the inviter can send a direct invite to, fetched client-side when
     * the invite sheet opens so the room poll never carries this list.
     */
    public function __invoke(Request $request, Stage $stage, StageService $stages): JsonResponse
    {
        $this->authorize('invite', $stage);

        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'data' => $stages->presentInviteCandidates($stage, $user),
        ]);
    }
}
