/**
 * @module systems/physics/MaterialDatabase
 * Universal physics materials — collision response uses these only.
 */

/**
 * @typedef {object} PhysicsMaterial
 * @property {string} id
 * @property {string} surfaceType
 * @property {number} friction 0..1 (1 = low tangential loss)
 * @property {number} restitution 0..1
 * @property {number} elasticity
 * @property {number} roughness
 * @property {number} hardness
 * @property {number} energyLoss 0..1
 * @property {number} absorption 0..1
 * @property {number} rollingResistance 0..1 (higher = stops sooner)
 * @property {string} soundProfile
 * @property {string} particleEffect
 * @property {number} deformationAmount
 * @property {boolean} isBreakable
 * @property {number} mass
 */

/** @type {Record<string, PhysicsMaterial>} */
const MATERIALS = {
    grass: {
        id: 'grass',
        surfaceType: 'grass',
        friction: 0.72,
        restitution: 0.38,
        elasticity: 0.4,
        roughness: 0.55,
        hardness: 0.25,
        energyLoss: 0.45,
        absorption: 0.4,
        rollingResistance: 0.14,
        soundProfile: 'grass',
        particleEffect: 'grass',
        deformationAmount: 0.02,
        isBreakable: false,
        mass: Infinity,
    },
    wetGrass: {
        id: 'wetGrass',
        surfaceType: 'wetGrass',
        friction: 0.55,
        restitution: 0.28,
        elasticity: 0.3,
        roughness: 0.35,
        hardness: 0.2,
        energyLoss: 0.55,
        absorption: 0.5,
        rollingResistance: 0.22,
        soundProfile: 'grass',
        particleEffect: 'mud',
        deformationAmount: 0.03,
        isBreakable: false,
        mass: Infinity,
    },
    dryGrass: {
        id: 'dryGrass',
        surfaceType: 'dryGrass',
        friction: 0.8,
        restitution: 0.45,
        elasticity: 0.48,
        roughness: 0.6,
        hardness: 0.28,
        energyLoss: 0.38,
        absorption: 0.32,
        rollingResistance: 0.1,
        soundProfile: 'grass',
        particleEffect: 'dust',
        deformationAmount: 0.015,
        isBreakable: false,
        mass: Infinity,
    },
    turf: {
        id: 'turf',
        surfaceType: 'artificialTurf',
        friction: 0.78,
        restitution: 0.5,
        elasticity: 0.55,
        roughness: 0.4,
        hardness: 0.45,
        energyLoss: 0.32,
        absorption: 0.25,
        rollingResistance: 0.12,
        soundProfile: 'grass',
        particleEffect: 'dust',
        deformationAmount: 0.01,
        isBreakable: false,
        mass: Infinity,
    },
    concrete: {
        id: 'concrete',
        surfaceType: 'concrete',
        friction: 0.7,
        restitution: 0.55,
        elasticity: 0.5,
        roughness: 0.7,
        hardness: 0.95,
        energyLoss: 0.25,
        absorption: 0.15,
        rollingResistance: 0.08,
        soundProfile: 'concrete',
        particleEffect: 'dust',
        deformationAmount: 0.005,
        isBreakable: false,
        mass: Infinity,
    },
    steelPost: {
        id: 'steelPost',
        surfaceType: 'metal',
        friction: 0.88,
        restitution: 0.64,
        elasticity: 0.7,
        roughness: 0.15,
        hardness: 0.98,
        energyLoss: 0.12,
        absorption: 0.08,
        rollingResistance: 0,
        soundProfile: 'metal',
        particleEffect: 'spark',
        deformationAmount: 0.04,
        isBreakable: false,
        mass: 85,
    },
    steelCrossbar: {
        id: 'steelCrossbar',
        surfaceType: 'metal',
        friction: 0.86,
        restitution: 0.62,
        elasticity: 0.68,
        roughness: 0.15,
        hardness: 0.98,
        energyLoss: 0.13,
        absorption: 0.09,
        rollingResistance: 0,
        soundProfile: 'metal',
        particleEffect: 'spark',
        deformationAmount: 0.04,
        isBreakable: false,
        mass: 70,
    },
    goalNet: {
        id: 'goalNet',
        surfaceType: 'net',
        friction: 0.35,
        restitution: 0.12,
        elasticity: 0.85,
        roughness: 0.5,
        hardness: 0.05,
        energyLoss: 0.7,
        absorption: 0.75,
        rollingResistance: 0.45,
        soundProfile: 'net',
        particleEffect: 'none',
        deformationAmount: 0.35,
        isBreakable: false,
        mass: 2,
    },
    advertisingBoard: {
        id: 'advertisingBoard',
        surfaceType: 'board',
        friction: 0.7,
        restitution: 0.34,
        elasticity: 0.55,
        roughness: 0.4,
        hardness: 0.4,
        energyLoss: 0.5,
        absorption: 0.45,
        rollingResistance: 0,
        soundProfile: 'board',
        particleEffect: 'dust',
        deformationAmount: 0.12,
        isBreakable: false,
        mass: 18,
    },
    stadiumWall: {
        id: 'stadiumWall',
        surfaceType: 'wall',
        friction: 0.75,
        restitution: 0.48,
        elasticity: 0.45,
        roughness: 0.55,
        hardness: 0.9,
        energyLoss: 0.3,
        absorption: 0.22,
        rollingResistance: 0,
        soundProfile: 'concrete',
        particleEffect: 'dust',
        deformationAmount: 0.02,
        isBreakable: false,
        mass: Infinity,
    },
    wood: {
        id: 'wood',
        surfaceType: 'wood',
        friction: 0.74,
        restitution: 0.42,
        elasticity: 0.5,
        roughness: 0.45,
        hardness: 0.55,
        energyLoss: 0.4,
        absorption: 0.35,
        rollingResistance: 0,
        soundProfile: 'wood',
        particleEffect: 'dust',
        deformationAmount: 0.06,
        isBreakable: false,
        mass: 40,
    },
    plastic: {
        id: 'plastic',
        surfaceType: 'plastic',
        friction: 0.68,
        restitution: 0.5,
        elasticity: 0.6,
        roughness: 0.3,
        hardness: 0.35,
        energyLoss: 0.35,
        absorption: 0.3,
        rollingResistance: 0,
        soundProfile: 'plastic',
        particleEffect: 'none',
        deformationAmount: 0.08,
        isBreakable: false,
        mass: 5,
    },
    fence: {
        id: 'fence',
        surfaceType: 'fence',
        friction: 0.55,
        restitution: 0.28,
        elasticity: 0.7,
        roughness: 0.6,
        hardness: 0.3,
        energyLoss: 0.55,
        absorption: 0.5,
        rollingResistance: 0,
        soundProfile: 'fence',
        particleEffect: 'none',
        deformationAmount: 0.18,
        isBreakable: false,
        mass: 12,
    },
    glass: {
        id: 'glass',
        surfaceType: 'glass',
        friction: 0.6,
        restitution: 0.52,
        elasticity: 0.4,
        roughness: 0.05,
        hardness: 0.85,
        energyLoss: 0.28,
        absorption: 0.18,
        rollingResistance: 0,
        soundProfile: 'glass',
        particleEffect: 'none',
        deformationAmount: 0.01,
        isBreakable: true,
        mass: 25,
    },
};

/**
 * @param {string} id
 * @returns {PhysicsMaterial}
 */
export function getMaterial(id) {
    return MATERIALS[id] ?? MATERIALS.grass;
}

/**
 * @param {string} id
 * @param {Partial<PhysicsMaterial>} patch
 */
export function registerMaterial(id, patch) {
    MATERIALS[id] = {
        ...(MATERIALS[id] ?? MATERIALS.grass),
        ...patch,
        id,
    };

    return MATERIALS[id];
}

/**
 * @returns {Readonly<Record<string, PhysicsMaterial>>}
 */
export function listMaterials() {
    return MATERIALS;
}

/** Map legacy SURFACES keys → material ids */
export const LEGACY_SURFACE_TO_MATERIAL = Object.freeze({
    grass: 'grass',
    wetGrass: 'wetGrass',
    dryGrass: 'dryGrass',
    post: 'steelPost',
    crossbar: 'steelCrossbar',
    net: 'goalNet',
    board: 'advertisingBoard',
    wall: 'stadiumWall',
});
