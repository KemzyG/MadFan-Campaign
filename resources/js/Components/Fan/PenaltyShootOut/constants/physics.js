/**
 * @module constants/physics
 * Tunables for FIFA-style ball simulation. Systems import coeffs from here only.
 */

export const BALL = Object.freeze({
    radius: 0.22,
    mass: 0.43,
    /** Official match-ball cross-section (m²) */
    area: Math.PI * 0.22 * 0.22,
    start: Object.freeze({ x: 0, y: 0.22, z: 11 }),
});

export const GOAL = Object.freeze({
    width: 7.32,
    height: 2.44,
    depth: 1.5,
    z: -16,
    postRadius: 0.07,
});

/** World colliders around the pitch / goal mouth */
export const WORLD = Object.freeze({
    backWallZ: GOAL.z - GOAL.depth - 0.55,
    boardsZ: -22.15,
    boardsTopY: 1.55,
    boardsHalfWidth: 16,
    outOfBoundsX: 16,
    outOfBoundsY: 14,
    settleSpeed: 0.28,
});

/**
 * Surface / material response for energy loss.
 * restitution ∈ [0,1], friction ∈ [0,1] (1 = no tangential loss).
 */
export const SURFACES = Object.freeze({
    grass: Object.freeze({ restitution: 0.38, friction: 0.72, rolling: 0.86, name: 'grass' }),
    wetGrass: Object.freeze({ restitution: 0.28, friction: 0.55, rolling: 0.78, name: 'wetGrass' }),
    dryGrass: Object.freeze({ restitution: 0.45, friction: 0.8, rolling: 0.9, name: 'dryGrass' }),
    post: Object.freeze({ restitution: 0.62, friction: 0.88, rolling: 1, name: 'post' }),
    crossbar: Object.freeze({ restitution: 0.6, friction: 0.86, rolling: 1, name: 'crossbar' }),
    net: Object.freeze({ restitution: 0.12, friction: 0.35, rolling: 0.55, name: 'net' }),
    board: Object.freeze({ restitution: 0.34, friction: 0.7, rolling: 1, name: 'board' }),
    wall: Object.freeze({ restitution: 0.48, friction: 0.75, rolling: 1, name: 'wall' }),
    gloveSoft: Object.freeze({ restitution: 0.18, friction: 0.45, rolling: 1, name: 'gloveSoft' }),
    gloveHard: Object.freeze({ restitution: 0.52, friction: 0.7, rolling: 1, name: 'gloveHard' }),
    fingertip: Object.freeze({ restitution: 0.58, friction: 0.82, rolling: 1, name: 'fingertip' }),
    body: Object.freeze({ restitution: 0.35, friction: 0.6, rolling: 1, name: 'body' }),
});

export const PHYSICS = Object.freeze({
    gravity: -9.81,
    /** Quadratic drag factor on |v|·v (tuned for 0.43 kg FIFA ball feel) */
    quadraticDrag: 0.00055,
    /** Linear air damping for very low speeds */
    linearDrag: 0.08,
    magnusCoefficient: 0.018,
    angularDamping: 0.45,
    spinCoupling: 0.4,
    maxSpeed: 42,
    minBounceSpeed: 0.55,
    rollWobble: 0.04,
    netDamping: 0.48,
    /** Default pitch surface key in SURFACES */
    defaultSurface: 'grass',
    /** Subtle ambient wind on YZ high balls only (m/s²) */
    wind: Object.freeze({ x: 0, y: 0, z: 0 }),
    deformationDecay: 8,
});

export const SHOT = Object.freeze({
    /** Soft loft — longer hang for readable arcs */
    maxFlightTime: 0.82,
    /** Full-power drive — still punches through but with flight */
    minFlightTime: 0.38,
    powerMin: 0.28,
    powerMax: 1,
    chargePerSecond: 2.4,
});

export const AIM = Object.freeze({
    maxX: 5.8,
    maxY: 4.2,
    minY: 0.15,
    sensitivity: 0.014,
    goalHalfWidth: GOAL.width / 2,
    goalHeight: GOAL.height,
});
