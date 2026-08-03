/**
 * @module math/clamp
 * @description Scalar helpers used by camera constraints and physics.
 */

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

/**
 * Exponential damp toward target (frame-rate independent).
 *
 * @param {number} current
 * @param {number} target
 * @param {number} lambda Higher = snappier
 * @param {number} dt Seconds
 */
export function damp(current, target, lambda, dt) {
    return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/**
 * @param {number} a
 * @param {number} b
 * @param {number} t
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}
