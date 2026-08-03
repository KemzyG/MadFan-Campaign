<?php

namespace App\Http\Controllers;

use App\Models\DeviceToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DeviceTokenController extends Controller
{
    /**
     * Register or update a device push token for the authenticated user.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'platform' => ['required', Rule::in(['ios', 'android', 'web'])],
        ]);

        // Upsert by token value — if the same token already exists for another user, take it over.
        $deviceToken = DeviceToken::firstOrNew(['token' => $data['token']]);
        $deviceToken->user_id = $request->user()->id;
        $deviceToken->platform = $data['platform'];
        $deviceToken->last_registered_at = now();
        $deviceToken->revoked_at = null;
        $deviceToken->save();

        return response()->json(['message' => 'Device token registered.'], 201);
    }

    /**
     * Revoke the provided token or the user's current device tokens.
     */
    public function destroy(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['nullable', 'string'],
        ]);

        $query = DeviceToken::where('user_id', $request->user()->id)
            ->whereNull('revoked_at');

        if (! empty($data['token'])) {
            $query->where('token', $data['token']);
        }

        $query->update(['revoked_at' => now()]);

        return response()->json(['message' => 'Device token(s) revoked.']);
    }
}
