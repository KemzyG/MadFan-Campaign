import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

let echoInstance = null;

/**
 * @returns {{ key: string, host?: string, port?: number|string, scheme?: string }|null}
 */
function resolveConfig() {
    const runtime =
        typeof window !== 'undefined' && window.__MADFAN_REVERB__?.key
            ? window.__MADFAN_REVERB__
            : null;

    if (runtime) {
        return runtime;
    }

    if (!import.meta.env.VITE_REVERB_APP_KEY) {
        return null;
    }

    return {
        key: import.meta.env.VITE_REVERB_APP_KEY,
        host: import.meta.env.VITE_REVERB_HOST || '',
        port: import.meta.env.VITE_REVERB_PORT,
        scheme: import.meta.env.VITE_REVERB_SCHEME ?? 'https',
    };
}

/**
 * Singleton Laravel Echo client for Social (Reverb / Pusher protocol).
 * Returns null when neither runtime (__MADFAN_REVERB__) nor Vite env is set (poll-only).
 *
 * Production: Blade injects window.__MADFAN_REVERB__ from SocialRealtime (same-origin
 * nginx /app proxy). Vite VITE_REVERB_* remains for local `npm run dev`.
 */
export function getEcho() {
    const config = resolveConfig();
    if (!config?.key) {
        return null;
    }

    if (echoInstance) {
        return echoInstance;
    }

    window.Pusher = Pusher;

    const scheme = config.scheme ?? 'https';
    const forceTLS = scheme === 'https';
    const configuredHost = config.host;
    const wsHost =
        configuredHost && String(configuredHost).length > 0
            ? configuredHost
            : window.location.hostname;

    echoInstance = new Echo({
        broadcaster: 'reverb',
        key: config.key,
        wsHost,
        wsPort: config.port ?? 80,
        wssPort: config.port ?? 443,
        forceTLS,
        enabledTransports: ['ws', 'wss'],
        authEndpoint: '/broadcasting/auth',
        withCredentials: true,
    });

    window.Echo = echoInstance;

    return echoInstance;
}

export function leaveEchoChannel(name) {
    if (!echoInstance) {
        return;
    }

    echoInstance.leave(name);
}
