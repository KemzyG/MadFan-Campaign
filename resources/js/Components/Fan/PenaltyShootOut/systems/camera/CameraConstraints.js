import { CAMERA } from '../../constants/camera';
import { clamp } from '../../math';

/**
 * @module systems/camera/CameraConstraints
 * @description Enforces FIFA-style penalty orbit limits. Never free-look.
 *
 * @example
 * const { yaw, pitch } = constrainOrbit(rawYaw, rawPitch);
 */

/**
 * @param {number} yaw
 * @param {number} pitch
 */
export function constrainOrbit(yaw, pitch) {
    return {
        yaw: clamp(yaw, CAMERA.minYaw, CAMERA.maxYaw),
        pitch: clamp(pitch, CAMERA.minPitch, CAMERA.maxPitch),
    };
}

/**
 * Ensures look target stays toward goal / ball, never behind shooter.
 *
 * @param {{ x: number, y: number, z: number }} ball
 * @param {{ x: number, y: number, z: number }} look
 */
export function constrainLookTarget(ball, look) {
    return {
        x: clamp(look.x, ball.x - 2.5, ball.x + 2.5),
        y: clamp(look.y, 0.4, 3.2),
        z: Math.min(look.z, ball.z - 0.5),
    };
}
