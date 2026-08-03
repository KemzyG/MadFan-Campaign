import { PHYSICS } from '../../constants/physics';
import { cross, length, scale } from '../../math';

/**
 * @module systems/ball/MagnusEffect
 * Curve from ball spin × air velocity (Magnus force).
 */

/**
 * @param {{ x: number, y: number, z: number }} spin
 * @param {{ x: number, y: number, z: number }} velocity
 * @param {number} dt
 * @param {number} [coefficient]
 * @returns {{ x: number, y: number, z: number }} delta velocity from Magnus
 */
export function magnusDeltaVelocity(spin, velocity, dt, coefficient = PHYSICS.magnusCoefficient) {
    const speed = length(velocity);
    if (speed < 0.5) {
        return { x: 0, y: 0, z: 0 };
    }

    // F ∝ ω × v ; scale gently so curve is readable but stable with aim solver
    const force = cross(spin, velocity);
    const mag = length(force);
    if (mag < 1e-6) {
        return { x: 0, y: 0, z: 0 };
    }

    return scale(force, coefficient * dt);
}
