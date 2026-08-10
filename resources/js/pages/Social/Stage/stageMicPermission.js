/**
 * Shared Stage mic permission helpers.
 * Browsers never re-prompt after a prior deny — site settings must be cleared.
 */

export const MIC_STATUS = {
    blocked:
        'Mic blocked — allow microphone for this site, then tap Enable microphone',
    insecure: 'Mic needs HTTPS — open this Stage on a secure (https://) URL',
    unavailable: 'Mic unavailable in this browser',
    missing: 'No microphone found — plug one in or choose another input device',
    busy: 'Mic is busy in another app — close it, then tap Enable microphone',
    failed: 'Could not open mic — check device settings, then tap Enable microphone',
};

export function isSecureMicContext() {
    if (typeof window === 'undefined') {
        return false;
    }
    if (window.isSecureContext) {
        return true;
    }
    // Localhost is treated as secure for getUserMedia in modern browsers.
    const host = window.location?.hostname || '';
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

export function mediaDevicesAvailable() {
    return Boolean(typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia);
}

/**
 * @param {unknown} err
 * @returns {{ code: string, status: string, retriable: boolean }}
 */
export function describeMicError(err) {
    if (!isSecureMicContext()) {
        return { code: 'insecure', status: MIC_STATUS.insecure, retriable: false };
    }
    if (!mediaDevicesAvailable()) {
        return { code: 'unavailable', status: MIC_STATUS.unavailable, retriable: false };
    }

    const name = String(err?.name || '');
    const message = String(err?.message || '').toLowerCase();

    if (
        name === 'NotAllowedError' ||
        name === 'PermissionDeniedError' ||
        message.includes('permission') ||
        message.includes('not allowed') ||
        message.includes('denied')
    ) {
        return { code: 'blocked', status: MIC_STATUS.blocked, retriable: true };
    }

    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        return { code: 'missing', status: MIC_STATUS.missing, retriable: true };
    }

    if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') {
        return { code: 'busy', status: MIC_STATUS.busy, retriable: true };
    }

    if (name === 'SecurityError') {
        return { code: 'blocked', status: MIC_STATUS.blocked, retriable: true };
    }

    return { code: 'failed', status: MIC_STATUS.failed, retriable: true };
}

export function isMicBlockedStatus(status) {
    const lower = String(status || '').toLowerCase();
    return (
        lower.includes('mic blocked') ||
        lower.includes('mic permission denied') ||
        lower.includes('enable microphone') ||
        lower.includes('mic needs https') ||
        lower.includes('no microphone') ||
        lower.includes('mic is busy') ||
        lower.includes('could not open mic')
    );
}

/**
 * Request mic inside a user gesture when possible.
 * Stops tracks immediately if `keepStream` is false (permission warm-up only).
 *
 * @param {{ keepStream?: boolean }} [options]
 * @returns {Promise<{ ok: true, stream?: MediaStream } | { ok: false, error: ReturnType<typeof describeMicError>, cause?: unknown }>}
 */
export async function requestStageMicrophone(options = {}) {
    const keepStream = Boolean(options.keepStream);

    if (!isSecureMicContext()) {
        return { ok: false, error: describeMicError({ name: 'SecurityError' }) };
    }
    if (!mediaDevicesAvailable()) {
        return { ok: false, error: describeMicError({ name: 'NotSupportedError' }) };
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true },
            video: false,
        });
        if (!keepStream) {
            stream.getTracks().forEach((track) => track.stop());
            return { ok: true };
        }
        return { ok: true, stream };
    } catch (cause) {
        return { ok: false, error: describeMicError(cause), cause };
    }
}
