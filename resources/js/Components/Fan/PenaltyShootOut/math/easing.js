/**
 * @module math/easing
 * @description Easing curves for camera and UI motion (never snap).
 */

export function easeOutCubic(t) {
    const x = clamp01(t);

    return 1 - (1 - x) ** 3;
}

export function easeInOutCubic(t) {
    const x = clamp01(t);

    return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

export function easeOutQuad(t) {
    const x = clamp01(t);

    return 1 - (1 - x) * (1 - x);
}

function clamp01(t) {
    return Math.min(1, Math.max(0, t));
}
