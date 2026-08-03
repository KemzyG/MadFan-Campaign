/**
 * @module systems/ball/BallAnimator
 * Derives presentation rotation from angular velocity (coupled to movement).
 */

/**
 * @param {{ x: number, y: number, z: number }} rotation
 * @param {{ x: number, y: number, z: number }} angularVelocity
 * @param {number} dt
 */
export function stepBallRotation(rotation, angularVelocity, dt) {
    return {
        x: rotation.x + angularVelocity.x * dt,
        y: rotation.y + angularVelocity.y * dt,
        z: rotation.z + angularVelocity.z * dt,
    };
}

/**
 * Idle pre-kick spin for life.
 *
 * @param {{ x: number, y: number, z: number }} rotation
 * @param {number} dt
 */
export function idleBallSpin(rotation, dt) {
    return {
        x: rotation.x,
        y: rotation.y + dt * 0.55,
        z: rotation.z,
    };
}
