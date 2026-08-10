<?php

namespace App\Support;

class WebRtcIce
{
    /**
     * RTCPeerConnection iceServers payload safe to send to browsers.
     *
     * @return list<array{urls: string|list<string>, username?: string, credential?: string}>
     */
    public static function servers(): array
    {
        $servers = [];

        foreach (config('webrtc.stun_urls', []) as $url) {
            if (! is_string($url) || $url === '') {
                continue;
            }
            $servers[] = ['urls' => $url];
        }

        $customTurn = self::customTurnServer();
        if ($customTurn !== null) {
            $servers[] = $customTurn;

            return $servers;
        }

        if (config('webrtc.use_public_turn_fallback')) {
            $public = config('webrtc.public_turn', []);
            $urls = $public['urls'] ?? [];
            $username = $public['username'] ?? null;
            $credential = $public['credential'] ?? null;

            if (is_array($urls) && $urls !== [] && filled($username) && filled($credential)) {
                $servers[] = [
                    'urls' => array_values($urls),
                    'username' => (string) $username,
                    'credential' => (string) $credential,
                ];
            }
        }

        return $servers;
    }

    public static function hasTurn(): bool
    {
        if (self::customTurnServer() !== null) {
            return true;
        }

        if (! config('webrtc.use_public_turn_fallback')) {
            return false;
        }

        $public = config('webrtc.public_turn', []);

        return filled($public['username'] ?? null)
            && filled($public['credential'] ?? null)
            && is_array($public['urls'] ?? null)
            && $public['urls'] !== [];
    }

    /**
     * @return array{urls: list<string>, username: string, credential: string}|null
     */
    public static function customTurnServer(): ?array
    {
        $urls = config('webrtc.turn_urls', []);
        $username = config('webrtc.turn_username');
        $credential = config('webrtc.turn_credential');

        if (! is_array($urls) || $urls === [] || blank($username) || blank($credential)) {
            return null;
        }

        return [
            'urls' => array_values(array_filter($urls, fn ($url): bool => is_string($url) && $url !== '')),
            'username' => (string) $username,
            'credential' => (string) $credential,
        ];
    }
}
