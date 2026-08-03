/**
 * Compatibility shim — use PhysicsEngine / ObjectRegistry for new code.
 * @module systems/ball/BallCollision
 */
import { getPhysicsEngine } from '../physics/PhysicsEngine';

/**
 * @param {import('./BallState').BallSnapshot} state
 */
export function resolveCollisions(state) {
    return getPhysicsEngine().step(state, 0, {});
}
