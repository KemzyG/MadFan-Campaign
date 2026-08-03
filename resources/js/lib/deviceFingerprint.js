const STORAGE_KEY = 'mf_device_id';

function randomId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID().replace(/-/g, '');
    }

    return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
}

function getOrCreateDeviceId() {
    try {
        const existing = window.localStorage.getItem(STORAGE_KEY);
        if (existing && existing.length >= 16) {
            return existing;
        }

        const created = randomId();
        window.localStorage.setItem(STORAGE_KEY, created);

        return created;
    } catch {
        return randomId();
    }
}

function canvasSignal() {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        if (! ctx) {
            return 'nocanvas';
        }

        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(0, 0, 120, 40);
        ctx.fillStyle = '#069';
        ctx.fillText('MadFan', 2, 12);

        return canvas.toDataURL().slice(-64);
    } catch {
        return 'canvas-error';
    }
}

/**
 * Stable-ish browser identity for one-account registration enforcement.
 * Combines a persistent local device id with coarse browser signals.
 */
export function getDeviceFingerprint() {
    if (typeof window === 'undefined') {
        return randomId();
    }

    const deviceId = getOrCreateDeviceId();
    const parts = [
        deviceId,
        navigator.userAgent || '',
        navigator.language || '',
        Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        String(screen.width),
        String(screen.height),
        String(screen.colorDepth || ''),
        String(navigator.hardwareConcurrency || ''),
        String(navigator.maxTouchPoints || 0),
        canvasSignal(),
    ];

    return parts.join('|').slice(0, 128);
}
