<?php

namespace App\Contracts\LiveStage;

use App\Models\LiveStage;
use App\Models\User;

/**
 * Boundary between the application plane (Laravel: auth, comments, presence,
 * moderation) and the media plane (a real-time SFU). Nothing outside this
 * contract's implementations may know how tokens are minted or what the
 * room-id format is — controllers/services call these five methods only.
 *
 * LiveKitMediaProvider is the only implementation today. Swapping providers
 * (or running two side by side) means writing a new class against this
 * contract and rebinding it in a service provider — no caller changes.
 */
interface MediaProvider
{
    /**
     * Whether this provider is actually configured/reachable (credentials
     * present, etc.) — callers check this before offering to go live rather
     * than discovering it mid-token-mint.
     */
    public function credentialsPresent(): bool;

    /**
     * Allocate (or resolve) the room this stage streams through. Returns the
     * provider-specific room identifier to persist on `live_stages.stream_room_id`.
     */
    public function createRoom(LiveStage $stage): string;

    /**
     * A token granting host publish rights (camera/mic) for this stage's room.
     *
     * @return array{token: string, url: string, room: string, identity: string, expires_at: int}
     */
    public function createHostToken(LiveStage $stage, User $host): array;

    /**
     * A token granting viewer subscribe-only rights — never publish, regardless
     * of what the client sends. Enforced provider-side by the token's own claims,
     * not by client-side UI, so a modified/forged client still can't publish.
     *
     * @return array{token: string, url: string, room: string, identity: string, expires_at: int}
     */
    public function createViewerToken(LiveStage $stage, User $viewer): array;

    /**
     * Tear down the room. Best-effort — a stage must still be able to end even
     * if the media server is unreachable (see LiveStageService::end).
     */
    public function endRoom(LiveStage $stage): void;

    /**
     * Live room state from the provider (participant count, publishing state),
     * where available. Providers that can't answer cheaply may return null.
     *
     * @return array<string, mixed>|null
     */
    public function getRoomState(LiveStage $stage): ?array;
}
