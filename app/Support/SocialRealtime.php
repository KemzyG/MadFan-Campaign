<?php

namespace App\Support;

class SocialRealtime
{
    public static function enabled(): bool
    {
        if (config('broadcasting.default') !== 'reverb') {
            return false;
        }

        return filled(config('broadcasting.connections.reverb.key'));
    }

    /**
     * Public Echo client settings (safe to expose in HTML).
     * HTTPS apps use same-origin nginx /app proxy; local uses broadcasting host/port.
     *
     * @return array{key: string, host: string, port: int, scheme: string}|null
     */
    public static function echoClientConfig(): ?array
    {
        if (! self::enabled()) {
            return null;
        }

        $key = (string) config('broadcasting.connections.reverb.key');
        if ($key === '') {
            return null;
        }

        $appUrl = (string) config('app.url');
        $parts = parse_url($appUrl) ?: [];
        $httpsApp = ($parts['scheme'] ?? 'http') === 'https'
            || app()->environment('production')
            || (bool) request()?->secure();

        // Same-origin WSS through nginx (/app) — do not expose REVERB_HOST=127.0.0.1 to browsers.
        if ($httpsApp) {
            return [
                'key' => $key,
                'host' => '',
                'port' => 443,
                'scheme' => 'https',
            ];
        }

        $options = config('broadcasting.connections.reverb.options', []);

        return [
            'key' => $key,
            'host' => (string) ($options['host'] ?? 'localhost'),
            'port' => (int) ($options['port'] ?? 8080),
            'scheme' => (string) ($options['scheme'] ?? 'http'),
        ];
    }

    /**
     * @return array{mode: string, note: string}
     */
    public static function chatMeta(): array
    {
        if (self::enabled()) {
            return [
                'mode' => 'reverb',
                'note' => 'Live via Laravel Reverb WebSockets. Slow Inertia poll kept as a reliability fallback.',
            ];
        }

        return [
            'mode' => 'poll',
            'note' => 'Set BROADCAST_CONNECTION=reverb and run `php artisan reverb:start` for push delivery. Falling back to Inertia polling.',
        ];
    }

    /**
     * @return array{mode: string, signal_mode: string, note: string}
     */
    public static function stageMeta(): array
    {
        if (self::enabled()) {
            return [
                'mode' => 'reverb',
                // Room + mesh signaling: WebSocket primary; HTTP only when Echo is down.
                'signal_mode' => 'reverb_primary',
                'note' => 'Stage room events via Reverb WebSockets. HTTP room/signal poll only if the socket drops.',
            ];
        }

        return [
            'mode' => 'poll',
            'signal_mode' => 'poll',
            'note' => 'HTTP poll for Stage room (and mesh signaling if voice driver is mesh). Enable Reverb for push delivery.',
        ];
    }
}
