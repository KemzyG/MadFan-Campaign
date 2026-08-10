import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

let echoInstance = null;

function reverbConfigured() {
    return Boolean(import.meta.env.VITE_REVERB_APP_KEY);
}

/**
 * Singleton Laravel Echo client for Social (Reverb / Pusher protocol).
 * Returns null when Vite Reverb env is missing (poll-only mode).
 *
 * Production (Render Docker): nginx proxies /app → Reverb on the same public
 * host/port. Leave VITE_REVERB_HOST empty so Echo uses window.location.hostname.
 */
export function getEcho() {
    if (!reverbConfigured()) {
        return null;
    }

    if (echoInstance) {
        return echoInstance;
    }

    window.Pusher = Pusher;

    const scheme = import.meta.env.VITE_REVERB_SCHEME ?? 'https';
    const forceTLS = scheme === 'https';
    const configuredHost = import.meta.env.VITE_REVERB_HOST;
    const wsHost =
        configuredHost && String(configuredHost).length > 0
            ? configuredHost
            : window.location.hostname;

    echoInstance = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost,
        wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
        wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
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
