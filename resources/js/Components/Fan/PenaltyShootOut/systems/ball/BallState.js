import { BALL } from '../../constants/physics';
import { copy, vec3 } from '../../math';

/**
 * @module systems/ball/BallState
 * Factory for ball simulation snapshots (immutable-friendly).
 */

/**
 * @typedef {object} BallSnapshot
 * @property {{ x: number, y: number, z: number }} position
 * @property {{ x: number, y: number, z: number }} velocity
 * @property {{ x: number, y: number, z: number }} spin
 * @property {{ x: number, y: number, z: number }} angularVelocity
 * @property {boolean} grounded
 * @property {boolean} inNet
 * @property {boolean} active
 * @property {number} [deform] momentary squash amount 0..~0.15
 */

/** @returns {BallSnapshot} */
export function createBallState() {
    return {
        position: copy(BALL.start),
        velocity: vec3(),
        spin: vec3(),
        angularVelocity: vec3(),
        grounded: false,
        inNet: false,
        active: false,
        deform: 0,
    };
}

/**
 * @param {BallSnapshot} state
 * @param {Partial<BallSnapshot>} patch
 */
export function patchBallState(state, patch) {
    return { ...state, ...patch };
}
