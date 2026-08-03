import { damp } from '../../math';
import { getPoseForState } from './GoalkeeperPoseLibrary';

/**
 * @module systems/goalkeeper/GoalkeeperAnimation
 * High-level pose + skeletal blend helpers.
 */

/**
 * Legacy compact pose (used by simple lean/yaw on root).
 *
 * @param {string} animState
 * @param {{ x: number, y: number, z: number }} position
 */
export function poseFromState(animState, position) {
    const lean = Math.max(-0.85, Math.min(0.85, -position.x * 0.22));
    const arms =
        animState === 'highSave' ? 1.1 : animState === 'lowSave' ? -0.35 : animState.startsWith('dive') ? 0.7 : 0.15;

    return {
        lean,
        yaw: position.x * 0.06,
        armRaise: arms,
        crouch: animState === 'ready' || animState === 'tracking' ? 0.12 : 0,
        skeleton: getPoseForState(animState),
    };
}

/**
 * Damp a THREE.Object3D toward a bone pose target.
 *
 * @param {import('three').Object3D|null|undefined} bone
 * @param {{ rotation?: [number, number, number], position?: [number, number, number] }|undefined} target
 * @param {number} lambda
 * @param {number} dt
 */
export function dampBoneToward(bone, target, lambda, dt) {
    if (!bone || !target) {
        return;
    }
    if (target.rotation) {
        bone.rotation.x = damp(bone.rotation.x, target.rotation[0], lambda, dt);
        bone.rotation.y = damp(bone.rotation.y, target.rotation[1], lambda, dt);
        bone.rotation.z = damp(bone.rotation.z, target.rotation[2], lambda, dt);
    }
    if (target.position) {
        bone.position.x = damp(bone.position.x, target.position[0], lambda, dt);
        bone.position.y = damp(bone.position.y, target.position[1], lambda, dt);
        bone.position.z = damp(bone.position.z, target.position[2], lambda, dt);
    }
}
