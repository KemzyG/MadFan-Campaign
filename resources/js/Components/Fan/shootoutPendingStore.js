/**
 * Durable local buffer for shootout awards/losses.
 * Survives refresh/close until the server ACKs each idempotency key.
 */

const STORAGE_PREFIX = 'mf:shootout:pending:v1:';

/**
 * @param {string|number} userId
 */
export function pendingStorageKey(userId) {
    return `${STORAGE_PREFIX}${userId}`;
}

/**
 * @returns {{ awards: array, losses: array }}
 */
export function emptyPending() {
    return { awards: [], losses: [] };
}

/**
 * @param {string|number} userId
 * @returns {{ awards: array, losses: array }}
 */
export function readPending(userId) {
    if (userId == null || typeof window === 'undefined' || !window.localStorage) {
        return emptyPending();
    }

    try {
        const raw = window.localStorage.getItem(pendingStorageKey(userId));
        if (!raw) {
            return emptyPending();
        }

        const parsed = JSON.parse(raw);
        return {
            awards: Array.isArray(parsed?.awards) ? parsed.awards : [],
            losses: Array.isArray(parsed?.losses) ? parsed.losses : [],
        };
    } catch {
        return emptyPending();
    }
}

/**
 * @param {string|number} userId
 * @param {{ awards?: array, losses?: array }} pending
 */
export function writePending(userId, pending) {
    if (userId == null || typeof window === 'undefined' || !window.localStorage) {
        return;
    }

    const next = {
        awards: Array.isArray(pending?.awards) ? pending.awards : [],
        losses: Array.isArray(pending?.losses) ? pending.losses : [],
        updated_at: new Date().toISOString(),
    };

    try {
        if (next.awards.length === 0 && next.losses.length === 0) {
            window.localStorage.removeItem(pendingStorageKey(userId));
            return;
        }

        window.localStorage.setItem(pendingStorageKey(userId), JSON.stringify(next));
    } catch {
        // Quota / private mode — keep in-memory only for this session.
    }
}

/**
 * @param {string|number} userId
 * @param {{ idempotency_key: string, zone: {col:number,row:number}, occurred_at: string, expected_points: number }} award
 */
export function appendAward(userId, award) {
    const pending = readPending(userId);
    pending.awards.push(award);
    writePending(userId, pending);
    return pending;
}

/**
 * @param {string|number} userId
 * @param {{ idempotency_key: string, result: string, occurred_at: string }} loss
 */
export function appendLoss(userId, loss) {
    const pending = readPending(userId);
    pending.losses.push(loss);
    writePending(userId, pending);
    return pending;
}

/**
 * Remove awards/losses whose keys were settled by the server.
 * Cooldown statuses are kept so they can sync after the lock ends.
 *
 * @param {string|number} userId
 * @param {Array<{ idempotency_key: string, status: string }>} awardResults
 * @param {Array<{ idempotency_key: string, status: string }>} lossResults
 */
export function applySyncResults(userId, awardResults = [], lossResults = []) {
    const pending = readPending(userId);
    const dropAward = new Set(
        (awardResults ?? [])
            .filter((row) => ['accepted', 'duplicate', 'throttled', 'invalid'].includes(row.status))
            .map((row) => row.idempotency_key),
    );
    const dropLoss = new Set(
        (lossResults ?? [])
            .filter((row) => ['accepted', 'duplicate'].includes(row.status))
            .map((row) => row.idempotency_key),
    );

    const next = {
        awards: pending.awards.filter((row) => !dropAward.has(row.idempotency_key)),
        losses: pending.losses.filter((row) => !dropLoss.has(row.idempotency_key)),
    };
    writePending(userId, next);
    return next;
}

/**
 * Pending totals still waiting for a successful sync.
 * For optimistic UI, count every buffered award (5s filtering is server-side on flush).
 *
 * @param {{ awards?: array, losses?: array }} pending
 * @param {{ respectSpacing?: boolean, minSecondsBetween?: number }} [options]
 */
export function pendingTotals(pending, options = {}) {
    const respectSpacing = Boolean(options.respectSpacing);
    const minSecondsBetween = options.minSecondsBetween ?? 5;
    const awards = Array.isArray(pending?.awards) ? [...pending.awards] : [];
    awards.sort((a, b) => String(a.occurred_at).localeCompare(String(b.occurred_at)));

    let lastCreditedAt = null;
    let points = 0;
    let shots = 0;
    const minMs = Math.max(0, minSecondsBetween) * 1000;

    for (const award of awards) {
        const at = Date.parse(award.occurred_at);
        if (Number.isNaN(at)) {
            continue;
        }

        if (respectSpacing && lastCreditedAt !== null && at - lastCreditedAt < minMs) {
            continue;
        }

        lastCreditedAt = at;
        points += Number(award.expected_points) || 0;
        shots += 1;
    }

    return {
        points,
        shots,
        losses: Array.isArray(pending?.losses) ? pending.losses.length : 0,
    };
}

/**
 * @param {{ awards?: array, losses?: array }} pending
 */
export function hasPending(pending) {
    return (pending?.awards?.length ?? 0) > 0 || (pending?.losses?.length ?? 0) > 0;
}
