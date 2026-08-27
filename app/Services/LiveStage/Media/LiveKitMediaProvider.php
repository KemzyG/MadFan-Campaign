<?php

namespace App\Services\LiveStage\Media;

use App\Contracts\LiveStage\MediaProvider;
use App\Enums\LiveStageType;
use App\Models\LiveStage;
use App\Models\User;
use Firebase\JWT\JWT;
use RuntimeException;

/**
 * LiveKit Cloud/self-hosted SFU. Laravel only mints participant JWTs — video
 * frames never pass through this app (see MediaProvider contract).
 *
 * Reuses the same HS256-JWT-via-firebase/php-jwt technique as the existing
 * Stage voice room's LiveKitTokenService: no LiveKit PHP SDK, since that pulls
 * in a protobuf toolchain this app deliberately doesn't carry.
 */
class LiveKitMediaProvider implements MediaProvider
{
    public function credentialsPresent(): bool
    {
        return filled(config('livekit.url'))
            && filled(config('livekit.api_key'))
            && filled(config('livekit.api_secret'));
    }

    public function createRoom(LiveStage $stage): string
    {
        // LiveKit rooms are created implicitly on first join — nothing to
        // provision ahead of time. The room id is deterministic from the
        // stage id so host and viewers always agree on it without a round trip.
        return 'madfan-live-'.$stage->id;
    }

    public function createHostToken(LiveStage $stage, User $host): array
    {
        $sources = $this->publishSourcesFor($stage->type);

        return $this->issue($stage, $host, canPublish: true, sources: $sources);
    }

    public function createViewerToken(LiveStage $stage, User $viewer): array
    {
        return $this->issue($stage, $viewer, canPublish: false, sources: []);
    }

    public function endRoom(LiveStage $stage): void
    {
        // No explicit teardown call: LiveKit Cloud reclaims a room once every
        // participant disconnects. Deliberately best-effort/no-op here rather
        // than calling the Server API (would need the protobuf SDK this app
        // avoids) — ending the stage in our own DB is what actually matters;
        // clients disconnect from the room once they see `status: ended`.
    }

    public function getRoomState(LiveStage $stage): ?array
    {
        // Would require the LiveKit Server (Twirp/protobuf) API — not wired up
        // for the reason above. Viewer count comes from our own presence table
        // (LiveStageViewerSession) instead; this stays null until that changes.
        return null;
    }

    /**
     * @return list<string>
     */
    private function publishSourcesFor(LiveStageType $type): array
    {
        return match ($type) {
            LiveStageType::Creator => ['microphone', 'camera'],
            LiveStageType::Gaming => ['microphone', 'camera', 'screen_share'],
            LiveStageType::Movie => ['microphone', 'screen_share'],
            LiveStageType::Presenter => ['microphone', 'camera', 'screen_share'],
        };
    }

    /**
     * @param  list<string>  $sources
     * @return array{token: string, url: string, room: string, identity: string, expires_at: int}
     */
    private function issue(LiveStage $stage, User $user, bool $canPublish, array $sources): array
    {
        if (! $this->credentialsPresent()) {
            throw new RuntimeException('LiveKit credentials are not configured.');
        }

        $apiKey = (string) config('livekit.api_key');
        $apiSecret = (string) config('livekit.api_secret');
        $url = (string) config('livekit.url');
        $ttl = max(60, (int) config('livekit.token_ttl', 3600));
        $now = time();
        $exp = $now + $ttl;
        $room = 'madfan-live-'.$stage->id;
        $identity = (string) $user->id;
        $name = filled($user->handle) ? (string) $user->handle : (string) $user->name;

        $video = [
            'roomJoin' => true,
            'room' => $room,
            'canSubscribe' => true,
            'canPublish' => $canPublish,
            'canPublishData' => false,
        ];

        if ($canPublish) {
            $video['canPublishSources'] = $sources;
        }

        $payload = [
            'iss' => $apiKey,
            'sub' => $identity,
            'name' => $name,
            'nbf' => $now - 10,
            'exp' => $exp,
            'video' => $video,
            'metadata' => json_encode([
                'live_stage_id' => $stage->id,
                'type' => $stage->type->value,
                'is_host' => $stage->isHost($user),
            ], JSON_THROW_ON_ERROR),
        ];

        return [
            'token' => JWT::encode($payload, $apiSecret, 'HS256'),
            'url' => $url,
            'room' => $room,
            'identity' => $identity,
            'expires_at' => $exp,
        ];
    }
}
