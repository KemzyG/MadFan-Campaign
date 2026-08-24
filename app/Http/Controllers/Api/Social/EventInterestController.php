<?php

namespace App\Http\Controllers\Api\Social;

use App\Enums\EventType;
use App\Http\Controllers\Controller;
use App\Models\SocialEventInterest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\ValidationException;

/**
 * "I'm in" marks on events feed cards.
 *
 * Events come from eight different models with no shared foreign key, so an
 * interest is stored against the provider-minted string key ("live_match:12")
 * rather than a polymorphic relation.
 */
class EventInterestController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        ['key' => $key, 'type' => $type] = $this->validated($request);

        SocialEventInterest::query()->firstOrCreate(
            [
                'user_id' => $request->user()->id,
                'event_key' => $key,
            ],
            [
                'event_type' => $type,
            ],
        );

        return $this->respond($key, true);
    }

    public function destroy(Request $request): JsonResponse
    {
        ['key' => $key] = $this->validated($request);

        SocialEventInterest::query()
            ->where('user_id', $request->user()->id)
            ->where('event_key', $key)
            ->delete();

        return $this->respond($key, false);
    }

    /**
     * @return array{key: string, type: string}
     */
    private function validated(Request $request): array
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'max:96', 'regex:/^[a-z_]+:[A-Za-z0-9._-]+$/'],
            'type' => ['required', 'string', new Enum(EventType::class)],
        ]);

        // Providers mint keys as "{type}:{id}". Rejecting mismatched pairs keeps
        // the stored event_type an honest description of the key.
        if (! str_starts_with($validated['key'], $validated['type'].':')) {
            throw ValidationException::withMessages([
                'key' => 'That event key does not belong to the given type.',
            ]);
        }

        return [
            'key' => $validated['key'],
            'type' => $validated['type'],
        ];
    }

    private function respond(string $key, bool $interested): JsonResponse
    {
        return response()->json([
            'interested' => $interested,
            'interest_count' => SocialEventInterest::query()->where('event_key', $key)->count(),
        ]);
    }
}
