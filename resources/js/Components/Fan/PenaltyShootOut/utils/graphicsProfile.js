/**
 * @module utils/graphicsProfile
 * Picks a mobile-safe default graphics profile for WebGL.
 */

/**
 * @returns {{ quality: 'low'|'medium'|'high', postprocessing: boolean, dpr: [number, number] }}
 */
export function resolveGraphicsProfile(win = typeof window !== 'undefined' ? window : null) {
    if (!win) {
        return { quality: 'medium', postprocessing: true, dpr: [1, 1.25] };
    }

    const nav = win.navigator ?? {};
    const coarsePointer = Boolean(win.matchMedia?.('(pointer: coarse)')?.matches);
    const narrow = Boolean(win.matchMedia?.('(max-width: 900px)')?.matches);
    const saveData = Boolean(nav.connection?.saveData);
    const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4;
    const lowCpu = typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4;
    const prefersReducedMotion = Boolean(win.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
    const isConstrained = coarsePointer || narrow || saveData || lowMemory || lowCpu || prefersReducedMotion;

    if (isConstrained) {
        return { quality: 'low', postprocessing: false, dpr: [1, 1] };
    }

    return { quality: 'medium', postprocessing: true, dpr: [1, 1.25] };
}

/**
 * @param {'low'|'medium'|'high'} quality
 * @returns {[number, number]}
 */
export function dprForQuality(quality) {
    if (quality === 'low') {
        return [1, 1];
    }

    if (quality === 'high') {
        return [1, 1.5];
    }

    return [1, 1.25];
}
