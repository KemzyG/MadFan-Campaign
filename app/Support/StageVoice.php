<?php

namespace App\Support;

use App\Enums\StageType;

class StageVoice
{
    /**
     * LiveKit `canPublishSources` for a participant, keyed off stage type +
     * host/on-stage status rather than the flat `role` column — this is what
     * lets a Streaming stage's promoted Speaker talk (mic) without ever being
     * allowed to appear on video, a distinction the role alone can't express.
     *
     * @return list<string>
     */
    public static function publishSourcesFor(StageType $type, bool $isHost, bool $isOnStage): array
    {
        if (! $isOnStage) {
            return [];
        }

        return match ($type) {
            StageType::Voice => ['microphone'],
            StageType::Video => ['microphone', 'camera', 'screen_share'],
            StageType::Streaming => $isHost
                ? ['microphone', 'camera', 'screen_share']
                : ['microphone'],
        };
    }

    public static function credentialsPresent(): bool
    {
        return filled(config('livekit.url'))
            && filled(config('livekit.api_key'))
            && filled(config('livekit.api_secret'));
    }

    /**
     * Effective Stage voice media driver for the current config.
     * Forced "livekit" without credentials falls back to mesh so the room still works.
     */
    public static function driver(): string
    {
        $requested = strtolower((string) config('livekit.driver', 'auto'));

        return match ($requested) {
            'mesh' => 'mesh',
            'livekit' => self::credentialsPresent() ? 'livekit' : 'mesh',
            default => self::credentialsPresent() ? 'livekit' : 'mesh',
        };
    }

    public static function usesLiveKit(): bool
    {
        return self::driver() === 'livekit';
    }

    public static function roomName(int $stageId): string
    {
        return 'madfan-stage-'.$stageId;
    }

    /**
     * @return array{driver: string, mode: string, livekit: array{url: string, room: string}|null, note: string}
     */
    public static function voiceModeMeta(): array
    {
        $driver = self::driver();
        $reverb = SocialRealtime::enabled();

        if ($driver === 'livekit') {
            return [
                'driver' => 'livekit',
                'mode' => $reverb ? 'livekit_reverb' : 'livekit_poll',
                'livekit' => [
                    'url' => (string) config('livekit.url'),
                    'room_prefix' => 'madfan-stage-',
                ],
                'note' => 'LiveKit SFU for Stage audio. App events via '
                    .($reverb ? 'Reverb WebSockets (HTTP room/signal poll only if WS drops).' : 'HTTP poll until Reverb is enabled.'),
            ];
        }

        return [
            'driver' => 'mesh',
            'mode' => $reverb ? 'webrtc_mesh_reverb' : 'webrtc_mesh_poll',
            'livekit' => null,
            'note' => 'Native WebRTC mesh. '
                .($reverb
                    ? 'Signaling prefers Reverb; HTTP /signals only if WS is down.'
                    : 'Signaling via HTTP poll until Reverb is enabled.'),
        ];
    }
}
