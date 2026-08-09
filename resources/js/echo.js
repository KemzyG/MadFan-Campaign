import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

let echoInstance = null;

function reverbConfigured() {
    return Boolean(import.meta.env.VITE_REVERB_APP_KEY);
}

/**
 * Singleton Laravel Echo client for Social (Reverb / Pusher protocol).
 * Returns null when Vite Reverb env is missing (poll-only mode).
 */
export function getEcho() {
    if (!reverbConfigured()) {
        return null;
    }

    if (echoInstance) {
        return echoInstance;
    }

    window.Pusher = Pusher;

    echoInstance = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
        wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
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
