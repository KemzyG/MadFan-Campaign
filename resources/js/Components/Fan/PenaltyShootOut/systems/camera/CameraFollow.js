import { BALL } from '../../constants/physics';
import { CAMERA } from '../../constants/camera';
import { add, lerp3, scale, vec3 } from '../../math';

/**
 * @module systems/camera/CameraFollow
 * Computes desired camera position / look-at from mode + ball.
 */

/**
 * @param {object} args
 * @param {string} args.mode
 * @param {{ x: number, y: number, z: number }} args.ball
 * @param {{ x: number, y: number, z: number }} args.velocity
 * @param {number} args.yaw
 * @param {number} args.pitch
 * @param {number} args.breath
 * @param {number} [args.zoom=1]
 */
export function computeFollowTarget({ mode, ball, velocity, yaw, pitch, breath, zoom = 1 }) {
    const isKick = mode === 'kick' || mode === 'goal' || mode === 'save';
    const tracked = isKick
        ? lerp3(BALL.start, ball, CAMERA.kickFollowMix)
        : ball;

    const pivot = { x: tracked.x, y: tracked.y + 0.35, z: tracked.z };
    let distance = CAMERA.aimDistance;

    if (mode === 'idle') {
        distance = CAMERA.idleDistance;
    } else if (isKick) {
        distance = CAMERA.kickDistance;
    }

    distance /= Math.max(0.85, zoom);

    const anticipate =
        mode === 'kick' || mode === 'goal'
            ? scale(velocity, CAMERA.anticipate)
            : vec3();

    const focus = add(pivot, anticipate);

    const position = {
        x: focus.x + Math.sin(yaw) * Math.cos(pitch) * distance,
        y: focus.y + Math.sin(pitch) * distance + 0.5 + breath,
        z: focus.z + Math.cos(yaw) * Math.cos(pitch) * distance,
    };

    const lookAt = {
        x: focus.x,
        y: focus.y + 0.25,
        z: focus.z - (isKick ? 5.5 : 3.5),
    };

    return { position, lookAt, focus };
}
