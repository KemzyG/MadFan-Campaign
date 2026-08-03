import { createShotSpin } from './BallSpin';
import { createShotVelocity } from './BallTrajectory';
import { createBallState } from './BallState';
import { ReplayRecorder } from './ReplayRecorder';
import { getPhysicsEngine } from '../physics/PhysicsEngine';

/**
 * @module systems/ball/BallController
 * Orchestrates the universal physics engine; keeps rendering out of the domain.
 */

const replayRecorder = new ReplayRecorder(180);

/**
 * @param {{ x: number, y: number }} aim
 * @param {number} power
 */
export function buildLaunch(aim, power) {
    const spin = createShotSpin(aim, power);
    const velocity = createShotVelocity(aim, power, spin);

    return { velocity, spin };
}

/**
 * @param {import('./BallState').BallSnapshot} state
 * @param {number} dt
 * @param {{
 *   pocketTime?: number,
 *   surfaceKey?: string,
 * }} [meta]
 */
export function stepBallSimulation(state, dt, meta = {}) {
    const result = getPhysicsEngine().step(state, dt, meta);
    replayRecorder.push(result.state, result.event);

    return result;
}

export function getBallReplayRecorder() {
    return replayRecorder;
}

export { createBallState };
