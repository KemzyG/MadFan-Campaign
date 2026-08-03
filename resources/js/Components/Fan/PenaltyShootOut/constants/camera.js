/**
 * @module constants/camera
 */

const DEG = Math.PI / 180;

export const CAMERA = Object.freeze({
    /** Distance from ball pivot while aiming */
    aimDistance: 4.2,
    /** Behind the ball during flight — higher = less aggressive zoom-in */
    kickDistance: 7.8,
    idleDistance: 4.35,
    minYaw: -25 * DEG,
    maxYaw: 25 * DEG,
    minPitch: 5 * DEG,
    maxPitch: 15 * DEG,
    defaultPitch: 9 * DEG,
    defaultYaw: 0,
    dampPosition: 6.2,
    dampLook: 7.5,
    breathAmplitude: 0.028,
    breathFrequency: 0.006,
    /** How hard the lens leads the ball velocity (lower = gentler follow zoom) */
    anticipate: 0.045,
    /** How much flight camera tracks ball vs. a fixed kick vantage (0..=1) */
    kickFollowMix: 0.55,
    shakeDecay: 4.5,
});

/** @typedef {'idle'|'aim'|'kick'|'replay'|'goal'|'save'} CameraMode */

export const CAMERA_MODES = Object.freeze({
    idle: 'idle',
    aim: 'aim',
    kick: 'kick',
    replay: 'replay',
    goal: 'goal',
    save: 'save',
});

export const REPLAY_ANGLES = Object.freeze({
    behindShooter: 'behindShooter',
    side: 'side',
    goalLine: 'goalLine',
    keeper: 'keeper',
    broadcast: 'broadcast',
});
