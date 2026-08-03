/**
 * @module systems/goalkeeper/GoalkeeperPoseLibrary
 * Skeletal pose targets (radians / local offsets) for realistic football keeper motion.
 * Blended by AnimationController / useKeeperSkeleton — never snap.
 */

/**
 * @typedef {object} BonePose
 * @property {[number, number, number]} [rotation]
 * @property {[number, number, number]} [position]
 */

/**
 * @typedef {Record<string, BonePose>} SkeletonPose
 */

/** @type {SkeletonPose} */
const IDLE = {
    hips: { rotation: [0.04, 0, 0], position: [0, 0, 0] },
    spine: { rotation: [0.06, 0, 0] },
    chest: { rotation: [0.04, 0, 0] },
    neck: { rotation: [-0.05, 0, 0] },
    head: { rotation: [0.02, 0, 0] },
    leftShoulder: { rotation: [0.15, 0, 0.35] },
    rightShoulder: { rotation: [0.15, 0, -0.35] },
    leftUpperArm: { rotation: [0.25, 0.1, 0.45] },
    rightUpperArm: { rotation: [0.25, -0.1, -0.45] },
    leftForeArm: { rotation: [0.2, 0, 0] },
    rightForeArm: { rotation: [0.2, 0, 0] },
    leftHand: { rotation: [0, 0, 0.1] },
    rightHand: { rotation: [0, 0, -0.1] },
    leftUpLeg: { rotation: [0.08, 0.04, 0.04] },
    rightUpLeg: { rotation: [0.08, -0.04, -0.04] },
    leftLeg: { rotation: [0.12, 0, 0] },
    rightLeg: { rotation: [0.12, 0, 0] },
    leftFoot: { rotation: [-0.12, 0, 0] },
    rightFoot: { rotation: [-0.12, 0, 0] },
};

/** @type {SkeletonPose} */
const READY = {
    hips: { rotation: [0.12, 0, 0], position: [0, -0.06, 0.02] },
    spine: { rotation: [0.14, 0, 0] },
    chest: { rotation: [0.1, 0, 0] },
    neck: { rotation: [-0.08, 0, 0] },
    head: { rotation: [0.06, 0, 0] },
    leftShoulder: { rotation: [0.35, 0.05, 0.55] },
    rightShoulder: { rotation: [0.35, -0.05, -0.55] },
    leftUpperArm: { rotation: [0.55, 0.2, 0.75] },
    rightUpperArm: { rotation: [0.55, -0.2, -0.75] },
    leftForeArm: { rotation: [0.55, 0, 0.1] },
    rightForeArm: { rotation: [0.55, 0, -0.1] },
    leftHand: { rotation: [0.2, 0, 0.2] },
    rightHand: { rotation: [0.2, 0, -0.2] },
    leftUpLeg: { rotation: [0.45, 0.08, 0.12] },
    rightUpLeg: { rotation: [0.45, -0.08, -0.12] },
    leftLeg: { rotation: [0.55, 0, 0] },
    rightLeg: { rotation: [0.55, 0, 0] },
    leftFoot: { rotation: [-0.35, 0.05, 0] },
    rightFoot: { rotation: [-0.35, -0.05, 0] },
};

/** @type {SkeletonPose} */
const DIVE_LEFT = {
    hips: { rotation: [0.2, 0.15, 0.85], position: [0, -0.15, 0] },
    spine: { rotation: [0.1, 0.2, 0.35] },
    chest: { rotation: [0.05, 0.15, 0.25] },
    neck: { rotation: [0.1, 0.35, 0] },
    head: { rotation: [0.05, 0.4, 0] },
    leftShoulder: { rotation: [0.1, 0.4, 1.2] },
    rightShoulder: { rotation: [0.8, -0.2, -0.3] },
    leftUpperArm: { rotation: [-0.2, 0.6, 1.6] },
    rightUpperArm: { rotation: [1.1, -0.3, -0.4] },
    leftForeArm: { rotation: [0.3, 0, 0] },
    rightForeArm: { rotation: [0.9, 0, 0] },
    leftHand: { rotation: [0, 0, 0.3] },
    rightHand: { rotation: [0.4, 0, 0] },
    leftUpLeg: { rotation: [0.3, 0.2, 0.5] },
    rightUpLeg: { rotation: [0.9, -0.1, -0.2] },
    leftLeg: { rotation: [0.2, 0, 0] },
    rightLeg: { rotation: [0.7, 0, 0] },
    leftFoot: { rotation: [-0.1, 0, 0] },
    rightFoot: { rotation: [-0.4, 0, 0] },
};

/** @type {SkeletonPose} */
const DIVE_RIGHT = {
    hips: { rotation: [0.2, -0.15, -0.85], position: [0, -0.15, 0] },
    spine: { rotation: [0.1, -0.2, -0.35] },
    chest: { rotation: [0.05, -0.15, -0.25] },
    neck: { rotation: [0.1, -0.35, 0] },
    head: { rotation: [0.05, -0.4, 0] },
    leftShoulder: { rotation: [0.8, 0.2, 0.3] },
    rightShoulder: { rotation: [0.1, -0.4, -1.2] },
    leftUpperArm: { rotation: [1.1, 0.3, 0.4] },
    rightUpperArm: { rotation: [-0.2, -0.6, -1.6] },
    leftForeArm: { rotation: [0.9, 0, 0] },
    rightForeArm: { rotation: [0.3, 0, 0] },
    leftHand: { rotation: [0.4, 0, 0] },
    rightHand: { rotation: [0, 0, -0.3] },
    leftUpLeg: { rotation: [0.9, 0.1, 0.2] },
    rightUpLeg: { rotation: [0.3, -0.2, -0.5] },
    leftLeg: { rotation: [0.7, 0, 0] },
    rightLeg: { rotation: [0.2, 0, 0] },
    leftFoot: { rotation: [-0.4, 0, 0] },
    rightFoot: { rotation: [-0.1, 0, 0] },
};

/** @type {SkeletonPose} */
const DIVE_CENTER = {
    hips: { rotation: [0.35, 0, 0], position: [0, -0.2, 0.08] },
    spine: { rotation: [0.25, 0, 0] },
    chest: { rotation: [0.2, 0, 0] },
    neck: { rotation: [0.15, 0, 0] },
    head: { rotation: [0.1, 0, 0] },
    leftShoulder: { rotation: [0.9, 0.1, 0.7] },
    rightShoulder: { rotation: [0.9, -0.1, -0.7] },
    leftUpperArm: { rotation: [1.4, 0.2, 0.5] },
    rightUpperArm: { rotation: [1.4, -0.2, -0.5] },
    leftForeArm: { rotation: [0.4, 0, 0] },
    rightForeArm: { rotation: [0.4, 0, 0] },
    leftHand: { rotation: [0.3, 0, 0.2] },
    rightHand: { rotation: [0.3, 0, -0.2] },
    leftUpLeg: { rotation: [0.7, 0.15, 0.2] },
    rightUpLeg: { rotation: [0.7, -0.15, -0.2] },
    leftLeg: { rotation: [0.5, 0, 0] },
    rightLeg: { rotation: [0.5, 0, 0] },
    leftFoot: { rotation: [-0.2, 0, 0] },
    rightFoot: { rotation: [-0.2, 0, 0] },
};

/** @type {SkeletonPose} */
const HIGH_SAVE = {
    ...READY,
    leftUpperArm: { rotation: [-0.4, 0.3, 1.1] },
    rightUpperArm: { rotation: [-0.4, -0.3, -1.1] },
    leftForeArm: { rotation: [0.2, 0, 0] },
    rightForeArm: { rotation: [0.2, 0, 0] },
    head: { rotation: [-0.25, 0, 0] },
    hips: { rotation: [0.05, 0, 0], position: [0, 0.08, 0] },
};

/** @type {SkeletonPose} */
const LOW_SAVE = {
    ...READY,
    hips: { rotation: [0.35, 0, 0], position: [0, -0.22, 0.05] },
    leftUpperArm: { rotation: [1.2, 0.2, 0.6] },
    rightUpperArm: { rotation: [1.2, -0.2, -0.6] },
    leftForeArm: { rotation: [0.8, 0, 0] },
    rightForeArm: { rotation: [0.8, 0, 0] },
    head: { rotation: [0.35, 0, 0] },
};

/** @type {SkeletonPose} */
const CELEBRATE = {
    hips: { rotation: [-0.05, 0, 0], position: [0, 0.05, 0] },
    spine: { rotation: [-0.1, 0, 0] },
    chest: { rotation: [-0.05, 0, 0] },
    neck: { rotation: [-0.1, 0, 0] },
    head: { rotation: [-0.05, 0, 0] },
    leftUpperArm: { rotation: [-1.2, 0.2, 0.4] },
    rightUpperArm: { rotation: [-1.2, -0.2, -0.4] },
    leftForeArm: { rotation: [0.3, 0, 0] },
    rightForeArm: { rotation: [0.3, 0, 0] },
    leftUpLeg: { rotation: [0.1, 0.05, 0.05] },
    rightUpLeg: { rotation: [0.1, -0.05, -0.05] },
    leftLeg: { rotation: [0.05, 0, 0] },
    rightLeg: { rotation: [0.05, 0, 0] },
    leftFoot: { rotation: [-0.05, 0, 0] },
    rightFoot: { rotation: [-0.05, 0, 0] },
    leftShoulder: { rotation: [0.2, 0, 0.3] },
    rightShoulder: { rotation: [0.2, 0, -0.3] },
    leftHand: { rotation: [0, 0, 0] },
    rightHand: { rotation: [0, 0, 0] },
};

/** @type {SkeletonPose} */
const DISAPPOINTED = {
    hips: { rotation: [0.15, 0, 0], position: [0, -0.04, 0] },
    spine: { rotation: [0.2, 0, 0] },
    chest: { rotation: [0.15, 0, 0] },
    neck: { rotation: [0.25, 0, 0] },
    head: { rotation: [0.35, 0, 0] },
    leftUpperArm: { rotation: [0.4, 0.1, 0.3] },
    rightUpperArm: { rotation: [0.4, -0.1, -0.3] },
    leftForeArm: { rotation: [0.5, 0, 0] },
    rightForeArm: { rotation: [0.5, 0, 0] },
    leftShoulder: { rotation: [0.2, 0, 0.25] },
    rightShoulder: { rotation: [0.2, 0, -0.25] },
    leftHand: { rotation: [0.1, 0, 0] },
    rightHand: { rotation: [0.1, 0, 0] },
    leftUpLeg: { rotation: [0.15, 0.04, 0.04] },
    rightUpLeg: { rotation: [0.15, -0.04, -0.04] },
    leftLeg: { rotation: [0.2, 0, 0] },
    rightLeg: { rotation: [0.2, 0, 0] },
    leftFoot: { rotation: [-0.15, 0, 0] },
    rightFoot: { rotation: [-0.15, 0, 0] },
};

/** @type {Record<string, SkeletonPose>} */
export const POSE_LIBRARY = {
    idle: IDLE,
    ready: READY,
    tracking: READY,
    predicting: READY,
    diveLeft: DIVE_LEFT,
    diveRight: DIVE_RIGHT,
    diveCenter: DIVE_CENTER,
    highSave: HIGH_SAVE,
    lowSave: LOW_SAVE,
    recover: READY,
    celebrate: CELEBRATE,
    disappointed: DISAPPOINTED,
    return: IDLE,
};

/**
 * @param {string} animState
 * @returns {SkeletonPose}
 */
export function getPoseForState(animState) {
    return POSE_LIBRARY[animState] ?? IDLE;
}
