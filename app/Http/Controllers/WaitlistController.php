<?php

namespace App\Http\Controllers;

use App\Http\Requests\WaitlistRequest;
use App\Models\Waitlist;
use App\Services\ReferralService;
use Illuminate\Http\JsonResponse;

class WaitlistController extends Controller
{
    public function __construct(protected ReferralService $referralService) {}

    public function store(WaitlistRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (! empty($data['referrer_fan_id'])) {
            $this->referralService->captureReferrer($data['referrer_fan_id']);
        }

        Waitlist::query()->firstOrCreate(
            ['email' => $data['email']],
            [
                'full_name' => $data['full_name'],
                'country' => $data['country'],
                'club' => $data['club'],
                'league' => $data['league'] ?? null,
                'source' => $data['source'] ?? $this->referralService->waitlistSource($data['referrer_fan_id'] ?? null),
            ],
        );

        return response()->json([
            'message' => 'You have been added to the waitlist!',
            'position' => Waitlist::query()->count(),
        ], 201);
    }

    public function count(): JsonResponse
    {
        return response()->json([
            'count' => Waitlist::query()->count(),
        ]);
    }
}
