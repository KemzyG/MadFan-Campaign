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
                'signal_mode' => 'reverb_with_poll_fallback',
                'note' => 'Stage room + WebRTC signaling prefer Reverb; HTTP poll remains as fallback.',
            ];
        }

        return [
            'mode' => 'poll',
            'signal_mode' => 'poll',
            'note' => 'Native WebRTC mesh. Signaling via HTTP poll until Reverb is enabled.',
        ];
    }
}
