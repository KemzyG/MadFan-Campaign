import { CAMERA } from '../../constants/camera';
import { damp } from '../../math';
import { breathOffset, goalZoomCurve, saveZoomCurve, shakeSample } from './CameraAnimations';
import { constrainLookTarget, constrainOrbit } from './CameraConstraints';
import { computeFollowTarget } from './CameraFollow';
import { pickReplayAngle, replayPose } from './ReplayCamera';
import { canTransition, resolveCameraMode } from './CameraStateMachine';

/**
 * @module systems/camera/CameraController
 * @description Orchestrates constraints, follow, animations, replay.
 * Apply output to THREE.Camera in the R3F hook — keep Three out of this module.
 *
 * @performance Call once per frame from useFrame; mutates scratch vectors passed in.
 */

/**
 * @typedef {object} CameraScratch
 * @property {{ x: number, y: number, z: number }} position
 * @property {{ x: number, y: number, z: number }} lookAt
 */

/**
 * @param {object} input
 * @param {string} input.phase
 * @param {string|null} input.lastResult
 * @param {boolean} input.replayActive
 * @param {string} input.replayAngle
 * @param {number} input.yaw
 * @param {number} input.pitch
 * @param {number} input.shake
 * @param {number} input.power
 * @param {boolean} input.charging
 * @param {{ x: number, y: number, z: number }} input.ball
 * @param {{ x: number, y: number, z: number }} input.velocity
 * @param {{ x: number, y: number, z: number }} input.keeper
 * @param {number} input.timeMs
 * @param {number} input.dt
 * @param {number} input.resultElapsed 0..1 progress in result phase
 * @param {CameraScratch} input.current
 * @returns {CameraScratch & { mode: string, suggestedReplayAngle?: string }}
 */
export function updateCameraController(input) {
    const mode = resolveCameraMode(input.phase, {
        lastResult: input.lastResult,
        replayActive: input.replayActive,
    });

    const orbit = constrainOrbit(input.yaw, input.pitch);
    const breath =
        mode === 'aim' || mode === 'idle'
            ? breathOffset(input.timeMs, input.charging ? 0.5 + input.power : 0.35)
            : 0;

    let zoom = 1;
    if (mode === 'goal') {
        zoom = goalZoomCurve(input.resultElapsed);
    } else if (mode === 'save') {
        zoom = saveZoomCurve(input.resultElapsed);
    }

    let desired;
    if (mode === 'replay') {
        desired = replayPose(input.replayAngle, input.ball, input.keeper);
    } else {
        desired = computeFollowTarget({
            mode,
            ball: input.ball,
            velocity: input.velocity,
            yaw: orbit.yaw,
            pitch: orbit.pitch,
            breath,
            zoom,
        });
        desired.lookAt = constrainLookTarget(input.ball, desired.lookAt);
    }

    const shake = shakeSample(input.shake, input.timeMs);
    const nextPos = {
        x: damp(input.current.position.x, desired.position.x + shake.x, CAMERA.dampPosition, input.dt),
        y: damp(input.current.position.y, desired.position.y + shake.y, CAMERA.dampPosition, input.dt),
        z: damp(input.current.position.z, desired.position.z, CAMERA.dampPosition, input.dt),
    };
    const nextLook = {
        x: damp(input.current.lookAt.x, desired.lookAt.x, CAMERA.dampLook, input.dt),
        y: damp(input.current.lookAt.y, desired.lookAt.y, CAMERA.dampLook, input.dt),
        z: damp(input.current.lookAt.z, desired.lookAt.z, CAMERA.dampLook, input.dt),
    };

    return {
        mode,
        position: nextPos,
        lookAt: nextLook,
        suggestedReplayAngle: pickReplayAngle({ result: input.lastResult, ball: input.ball }),
    };
}

export { canTransition, pickReplayAngle, resolveCameraMode };
