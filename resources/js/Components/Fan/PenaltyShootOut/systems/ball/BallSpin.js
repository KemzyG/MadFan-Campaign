import { SHOT } from '../../constants/physics';
import { scale, vec3 } from '../../math';

/**
 * @module systems/ball/BallSpin
 * Spin profiles: topspin, backspin, sidespin, knuckle (near-zero).
 */

/**
 * @param {{ x: number, y: number }} aim
 * @param {number} power 0..1
 * @returns {{ x: number, y: number, z: number }}
 */
export function createShotSpin(aim, power) {
    const p = Math.min(SHOT.powerMax, Math.max(SHOT.powerMin, power));

    // Near full-power centered aims get knuckle (low spin, flutter later via random micro)
    const centered = Math.hypot(aim.x, aim.y - 1.15) < 0.55;
    if (centered && p > 0.92) {
        return {
            x: (Math.random() - 0.5) * 0.8,
            y: (Math.random() - 0.5) * 0.8,
            z: (Math.random() - 0.5) * 0.4,
        };
    }

    return {
        // Backspin when aiming high, topspin when low
        x: -(aim.y - 1.1) * 5.2 * p,
        // Sidespin for curve
        y: aim.x * 6.4 * p,
        z: aim.x * 1.35 * p,
    };
}

/**
 * @param {{ x: number, y: number, z: number }} velocity
 * @param {{ x: number, y: number, z: number }} spin
 * @param {number} radius
 */
export function spinToAngular(velocity, spin, radius) {
    const rolling = {
        x: -velocity.z / Math.max(radius, 0.01),
        y: 0,
        z: velocity.x / Math.max(radius, 0.01),
    };

    return {
        x: rolling.x + spin.x * 0.4,
        y: spin.y * 0.6,
        z: rolling.z + spin.z * 0.28,
    };
}

/**
 * @param {{ x: number, y: number, z: number }} spin
 * @param {number} factor
 */
export function dampSpin(spin, factor) {
    return scale(spin, factor);
}

export { vec3 };
