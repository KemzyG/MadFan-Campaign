/**
 * @module constants/goalkeeperAppearance
 *
 * Production asset contract — change ONLY `url` (and optional clip aliases)
 * when swapping in a photoreal scanned / MetaHuman / Character Creator GLB.
 *
 * Expected asset:
 * - Humanoid skeleton (Mixamo / UE / CC compatible)
 * - Origin at feet, +Y up, facing −Z (or set yawOffset)
 * - Height ≈ 1.8–2.0 m
 * - Separate materials: skin, jersey, gloves, shorts, socks, boots
 * - Optional clips: idle, ready, diveLeft, diveRight, diveCenter, highSave, lowSave, catch, recover, celebrate, disappointed
 * - DRACO / meshopt OK
 */

export const KEEPER_MODEL = Object.freeze({
    /**
     * Production path — replace this file with your AAA goalkeeper GLB.
     * Temporary placeholder ships as Soldier.glb (three.js example) until then.
     */
    url: '/models/goalkeeper/keeper.glb',
    /** Fallback if production file missing (same folder). */
    placeholderUrl: '/models/goalkeeper/keeper.placeholder.glb',
    heightMeters: 1.9,
    /** Measured height of the temporary Soldier asset in meters */
    assetNativeHeight: 1.8,
    /** Extra yaw so the model faces the ball (+Z toward pitch) */
    yawOffset: 0,
    /** Enable Google DRACO decoder via drei (only if your GLB uses DRACO) */
    useDraco: false,
    castShadow: true,
    receiveShadow: true,
    envMapIntensity: 0.85,
});

/**
 * Map game FSM states → preferred clip name candidates (first match wins).
 * Rename clips in your DCC export or edit this table — no code changes elsewhere.
 */
export const KEEPER_CLIP_ALIASES = Object.freeze({
    idle: ['idle', 'Idle', 'Breathing Idle', 'idle_breathing', 'T-Pose'],
    ready: ['ready', 'Ready', 'Idle', 'idle', 'Crouch Idle', 'Fight Idle'],
    tracking: ['ready', 'Idle', 'idle'],
    predicting: ['ready', 'Idle'],
    diveLeft: ['diveLeft', 'Dive Left', 'dive_left', 'Fall', 'Death'],
    diveRight: ['diveRight', 'Dive Right', 'dive_right', 'Fall', 'Death'],
    diveCenter: ['diveCenter', 'Dive', 'dive', 'Fall'],
    highSave: ['highSave', 'Jump', 'jump', 'Catch'],
    lowSave: ['lowSave', 'Crouch', 'crouch', 'Idle'],
    recover: ['recover', 'Get Up', 'Idle', 'idle'],
    celebrate: ['celebrate', 'Victory', 'Wave', 'Idle'],
    disappointed: ['disappointed', 'Sad', 'Idle', 'Death'],
    return: ['idle', 'Idle'],
});

/** Material name substrings → enhancement profile */
export const KEEPER_MATERIAL_PROFILES = Object.freeze({
    skin: { match: [/skin/i, /body/i, /face/i, /head/i], roughness: 0.45, metalness: 0, envMapIntensity: 0.55 },
    jersey: { match: [/jersey/i, /shirt/i, /top/i, /cloth/i, /uniform/i], roughness: 0.7, metalness: 0.02, envMapIntensity: 0.4 },
    gloves: { match: [/glove/i, /hand/i], roughness: 0.55, metalness: 0.05, envMapIntensity: 0.5 },
    shorts: { match: [/short/i, /pant/i], roughness: 0.75, metalness: 0.01, envMapIntensity: 0.35 },
    socks: { match: [/sock/i], roughness: 0.85, metalness: 0, envMapIntensity: 0.3 },
    boots: { match: [/boot/i, /shoe/i, /cleat/i], roughness: 0.4, metalness: 0.2, envMapIntensity: 0.7 },
    default: { roughness: 0.55, metalness: 0.05, envMapIntensity: 0.6 },
});

export const KEEPER_LOD = Object.freeze({
    near: 8,
    mid: 18,
    far: 35,
});

/** Bone name candidates for head look-at (Mixamo / UE / CC) */
export const KEEPER_HEAD_BONES = Object.freeze([
    'Head',
    'mixamorigHead',
    'mixamorig:Head',
    'head',
    'CC_Base_Head',
    'Head_M',
]);

export const KEEPER_EYE_BONES = Object.freeze([
    'LeftEye',
    'RightEye',
    'mixamorigLeftEye',
    'mixamorigRightEye',
    'mixamorig:LeftEye',
    'mixamorig:RightEye',
    'CC_Base_L_Eye',
    'CC_Base_R_Eye',
]);
