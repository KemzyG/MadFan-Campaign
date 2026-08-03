import { damp } from '../../math';
import { KEEPER_TUNING } from '../../constants/goalkeeper';

/**
 * @module systems/goalkeeper/GoalkeeperPhysics
 * Moves keeper body toward dive target with damping (not full ragdoll).
 */

/**
 * @param {object} args
 * @param {{ x: number, y: number, z: number }} args.position
 * @param {{ x: number, y: number }} args.target
 * @param {string} args.difficulty
 * @param {number} args.dt
 * @param {string} args.homeZ
 */
export function stepKeeperBody({ position, target, difficulty, dt, homeZ }) {
    const speed = (KEEPER_TUNING[difficulty] ?? KEEPER_TUNING.medium).diveSpeed;

    return {
        x: damp(position.x, target.x, speed, dt),
        y: damp(position.y, target.y, speed * 0.75, dt),
        z: homeZ,
    };
}

/**
 * Idle sway while waiting.
 *
 * @param {number} timeMs
 * @param {number} currentX
 * @param {number} dt
 */
export function idleSway(timeMs, currentX, dt) {
    const target = Math.sin(timeMs * 0.0024) * 0.38;

    return damp(currentX, target, 2.8, dt);
}
