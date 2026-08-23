/**
 * Pure aggregation of per-peer voice connection states into the room-level
 * indicator model. Driver-agnostic: both the LiveKit SFU client
 * (useStageLiveKitVoice) and the WebRTC mesh fallback (useStageVoice) emit the
 * same per-peer `state` shape keyed by numeric user_id, and this reducer rolls
 * them up for the header pill + connection panel.
 *
 * Kept free of React / DOM so it can be reasoned about and unit-tested in
 * isolation (see the node smoke check referenced in the PR).
 *
 * Per-peer state shape (all fields except `phase` optional):
 *   {
 *     phase:   'connecting' | 'connected' | 'verified' | 'failed',
 *     role:    'send' | 'recv' | 'duplex',   // direction relative to me
 *     rx:      boolean,   // I am receiving their audio
 *     tx:      boolean,   // they are receiving mine (mesh RTCP only; null on SFU)
 *     muted:   boolean,   // remote mic muted — intentional silence, still "verified"
 *     quality: 'good' | 'fair' | 'poor' | 'lost' | null,
 *   }
 */

export const VOICE_PHASES = ['connecting', 'connected', 'verified', 'failed'];

/** Coerce a Set/array/iterable of ids into a de-duped array of finite numbers. */
function normalizeIds(speakerIds) {
    const out = [];
    const seen = new Set();
    const push = (value) => {
        const id = Number(value);
        if (Number.isFinite(id) && !seen.has(id)) {
            seen.add(id);
            out.push(id);
        }
    };
    if (!speakerIds) {
        return out;
    }
    if (typeof speakerIds.forEach === 'function') {
        speakerIds.forEach(push); // Set or Array
    } else if (Array.isArray(speakerIds)) {
        speakerIds.forEach(push);
    }
    return out;
}

function readPeer(peerStates, id) {
    if (!peerStates) {
        return null;
    }
    if (typeof peerStates.get === 'function') {
        return peerStates.get(id) ?? null;
    }
    return peerStates[id] ?? null;
}

/**
 * headline drives the pill colour/wording:
 *   idle       — no speaker peers to reach (I'm alone / only listeners)
 *   connecting — at least one peer still negotiating transport
 *   verifying  — all transports up, but not all confirmed carrying audio yet
 *   verified   — every speaker peer confirmed end-to-end
 *   degraded   — at least one peer failed / lost
 */
function computeHeadline({ total, connected, verified, failed }) {
    if (total === 0) {
        return 'idle';
    }
    if (failed > 0) {
        return 'degraded';
    }
    if (verified === total) {
        return 'verified';
    }
    if (verified + connected === total) {
        return 'verifying';
    }
    return 'connecting';
}

/**
 * Roll per-peer states up over the current on-stage speaker set (excluding me).
 * A known speaker with no peer entry yet counts as `connecting` — we are trying
 * to reach them but transport isn't up. Peer entries for non-speakers are ignored
 * so the pill count always matches the speaker tiles.
 *
 * @param {Map<number, object>|Object} peerStates
 * @param {Set<number>|Array<number>} speakerIds  on-stage speakers, excluding me
 * @returns {{total:number, connecting:number, connected:number, verified:number,
 *   failed:number, anyFailed:boolean, allVerified:boolean, headline:string,
 *   peers:Array<{userId:number, phase:string}>}}
 */
export function reduceVoiceConnection(peerStates, speakerIds) {
    const ids = normalizeIds(speakerIds);
    let connecting = 0;
    let connected = 0;
    let verified = 0;
    let failed = 0;
    const peers = [];

    for (const id of ids) {
        const state = readPeer(peerStates, id);
        const phase = state?.phase ?? 'connecting';
        switch (phase) {
            case 'verified':
                verified += 1;
                break;
            case 'connected':
                connected += 1;
                break;
            case 'failed':
                failed += 1;
                break;
            default:
                connecting += 1;
                break;
        }
        peers.push(state ? { userId: id, ...state, phase } : { userId: id, phase: 'connecting' });
    }

    const total = ids.length;
    return {
        total,
        connecting,
        connected,
        verified,
        failed,
        anyFailed: failed > 0,
        allVerified: total > 0 && verified === total,
        headline: computeHeadline({ total, connected, verified, failed }),
        peers,
    };
}

/** Short label for the header pill, derived from the aggregate. */
export function voiceConnectionLabel(agg) {
    if (!agg || agg.total === 0) {
        return 'Voice ready';
    }
    const { total, verified, failed, headline } = agg;
    switch (headline) {
        case 'verified':
            return `${total}/${total} verified`;
        case 'degraded':
            return `${verified}/${total} · ${failed} blocked`;
        case 'verifying':
            return `Verifying ${verified}/${total}…`;
        default:
            return `Connecting ${verified}/${total}…`;
    }
}

/** Longer, human sentence for the connection panel summary line. */
export function voiceConnectionSummary(agg) {
    if (!agg || agg.total === 0) {
        return 'No other speakers to connect to yet.';
    }
    const { total, verified, failed, headline } = agg;
    const others = total === 1 ? '1 speaker' : `${total} speakers`;
    switch (headline) {
        case 'verified':
            return `Voice verified end-to-end with ${others}.`;
        case 'degraded':
            return `${failed} of ${total} speaker connections blocked — voice may not reach everyone.`;
        case 'verifying':
            return `Connected to ${others}; confirming audio is flowing (${verified}/${total}).`;
        default:
            return `Connecting to ${others} (${verified}/${total} verified)…`;
    }
}
