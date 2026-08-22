/**
 * Normalize a WebRTC SessionDescription SDP string for setRemoteDescription.
 *
 * Chrome requires CRLF line endings and a trailing CRLF. Laravel TrimStrings
 * (and some transports) can strip trailing whitespace, which makes the last
 * attribute line (often `a=ssrc:… msid:…`) report as "Invalid SDP line".
 *
 * @param {unknown} sdp
 * @returns {string|null}
 */
export function normalizeStageSdp(sdp) {
    if (typeof sdp !== 'string') {
        return null;
    }

    let text = sdp.trim();
    if (!text) {
        return null;
    }

    // Recover payloads that were JSON-stringified twice (literal \n / \r\n).
    if (!text.includes('\n') && (text.includes('\\n') || text.includes('\\r'))) {
        text = text.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\\r/g, '\n');
    }

    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    text = text.replace(/\n/g, '\r\n');

    if (!text.endsWith('\r\n')) {
        text += '\r\n';
    }

    return text;
}

/**
 * @param {unknown} payload
 * @returns {{ type: string, sdp: string }|null}
 */
export function normalizeRemoteDescription(payload) {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const sdp = normalizeStageSdp(payload.sdp);
    if (!sdp) {
        return null;
    }

    const type = typeof payload.type === 'string' && payload.type ? payload.type : null;
    if (!type) {
        return null;
    }

    return { type, sdp };
}

/**
 * Remote answers are only valid while waiting for the peer's reply to our offer.
 * Duplicate or stale answers (after stable) must be ignored to avoid InvalidStateError.
 *
 * @param {RTCSignalingState|string} signalingState
 * @returns {boolean}
 */
export function canApplyRemoteAnswer(signalingState) {
    return signalingState === 'have-local-offer';
}

/**
 * Ignore glare offers when we already sent the local offer as initiator.
 *
 * @param {RTCSignalingState|string} signalingState
 * @param {{ initiator?: boolean }} options
 * @returns {boolean}
 */
export function canApplyRemoteOffer(signalingState, { initiator = false } = {}) {
    if (signalingState === 'stable') {
        return true;
    }

    if (signalingState === 'have-local-offer') {
        return !initiator;
    }

    return false;
}
