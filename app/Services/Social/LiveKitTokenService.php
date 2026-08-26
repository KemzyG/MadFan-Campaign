<?php

namespace App\Services\Social;

use App\Enums\StageParticipantRole;
use App\Models\Stage;
use App\Models\StageParticipant;
use App\Models\User;
use App\Support\StageVoice;
use Firebase\JWT\JWT;
use RuntimeException;

class LiveKitTokenService
{
    /**
     * Mint a LiveKit participant access token (HS256 JWT).
     * Uses firebase/php-jwt already in the app — no LiveKit PHP SDK (protobuf conflict).
     *
     * @return array{token: string, url: string, room: string, identity: string, can_publish: bool, can_publish_video: bool, expires_at: int}
     */
    public function issue(Stage $stage, User $user, StageParticipant $participant): array
    {
        if (! StageVoice::credentialsPresent()) {
            throw new RuntimeException('LiveKit credentials are not configured.');
        }

        $apiKey = (string) config('livekit.api_key');
        $apiSecret = (string) config('livekit.api_secret');
        $url = (string) config('livekit.url');
        $ttl = max(60, (int) config('livekit.token_ttl', 3600));
        $now = time();
        $exp = $now + $ttl;
        $isOnStage = $participant->isOnStage();
        $isHost = $participant->role === StageParticipantRole::Host;
        $sources = StageVoice::publishSourcesFor($stage->type, $isHost, $isOnStage);
        $canPublish = $sources !== [];
        $room = StageVoice::roomName((int) $stage->id);
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
                'stage_id' => $stage->id,
                'type' => $stage->type->value,
                'role' => $participant->role->value,
                'on_stage' => $isOnStage,
                'can_publish_video' => in_array('camera', $sources, true) || in_array('screen_share', $sources, true),
            ], JSON_THROW_ON_ERROR),
        ];

        return [
            'token' => JWT::encode($payload, $apiSecret, 'HS256'),
            'url' => $url,
            'room' => $room,
            'identity' => $identity,
            'can_publish' => $canPublish,
            'can_publish_video' => in_array('camera', $sources, true) || in_array('screen_share', $sources, true),
            'expires_at' => $exp,
        ];
    }
}
