import { BALL, GOAL, WORLD } from '../../constants/physics';
import { getObjectRegistry } from './ObjectRegistry';

/**
 * @module systems/physics/stadiumColliders
 * Registers default stadium geometry with the universal registry.
 * Add future props by calling registry.register(...) — no new collision code.
 */

let registered = false;

/**
 * @param {import('./ObjectRegistry').ObjectRegistry} [registry]
 */
export function registerStadiumColliders(registry = getObjectRegistry()) {
    if (registered && registry.colliders.size > 0) {
        return registry;
    }

    registry.clear();

    const halfW = GOAL.width / 2;

    // Ground plane (priority first)
    registry.register({
        id: 'pitch-ground',
        priority: 10,
        materialId: 'grass',
        layer: 'ground',
        shape: 'plane',
        params: { point: { x: 0, y: 0, z: 0 }, normal: { x: 0, y: 1, z: 0 } },
        tags: ['ground', 'pitch'],
    });

    // Upright posts (hollow steel)
    registry.register({
        id: 'goal-post-left',
        priority: 20,
        materialId: 'steelPost',
        layer: 'goalframe',
        shape: 'cylinder',
        params: {
            axis: 'y',
            origin: { x: -halfW, y: 0, z: GOAL.z },
            radius: GOAL.postRadius,
            min: 0,
            max: GOAL.height,
        },
        tags: ['post', 'goalframe', 'metal'],
    });

    registry.register({
        id: 'goal-post-right',
        priority: 20,
        materialId: 'steelPost',
        layer: 'goalframe',
        shape: 'cylinder',
        params: {
            axis: 'y',
            origin: { x: halfW, y: 0, z: GOAL.z },
            radius: GOAL.postRadius,
            min: 0,
            max: GOAL.height,
        },
        tags: ['post', 'goalframe', 'metal'],
    });

    // Crossbar
    registry.register({
        id: 'goal-crossbar',
        priority: 21,
        materialId: 'steelCrossbar',
        layer: 'goalframe',
        shape: 'cylinder',
        params: {
            axis: 'x',
            origin: { x: 0, y: GOAL.height, z: GOAL.z },
            radius: GOAL.postRadius,
            min: -halfW,
            max: halfW,
        },
        tags: ['crossbar', 'goalframe', 'metal'],
    });

    // Soft net volume (trigger → net pocket sim)
    registry.register({
        id: 'goal-net-volume',
        priority: 30,
        materialId: 'goalNet',
        layer: 'net',
        shape: 'aabb',
        params: {
            min: { x: -halfW + BALL.radius * 0.2, y: 0, z: GOAL.z - GOAL.depth - 0.2 },
            max: { x: halfW - BALL.radius * 0.2, y: GOAL.height - BALL.radius * 0.15, z: GOAL.z + 0.05 },
        },
        tags: ['net', 'soft', 'trigger'],
    });

    // Back wall behind goal
    registry.register({
        id: 'goal-back-wall',
        priority: 40,
        materialId: 'stadiumWall',
        layer: 'wall',
        shape: 'plane',
        params: {
            point: { x: 0, y: 0, z: WORLD.backWallZ },
            normal: { x: 0, y: 0, z: 1 },
        },
        tags: ['wall'],
    });

    // Side stadium shells (from Stadium mesh positions)
    registry.register({
        id: 'stand-left',
        priority: 45,
        materialId: 'stadiumWall',
        layer: 'wall',
        shape: 'aabb',
        params: {
            min: { x: -31, y: 0, z: -32 },
            max: { x: -25, y: 9, z: 16 },
        },
        tags: ['wall', 'stand'],
    });

    registry.register({
        id: 'stand-right',
        priority: 45,
        materialId: 'stadiumWall',
        layer: 'wall',
        shape: 'aabb',
        params: {
            min: { x: 25, y: 0, z: -32 },
            max: { x: 31, y: 9, z: 16 },
        },
        tags: ['wall', 'stand'],
    });

    registry.register({
        id: 'stand-back',
        priority: 45,
        materialId: 'stadiumWall',
        layer: 'wall',
        shape: 'aabb',
        params: {
            min: { x: -26, y: 0, z: -37 },
            max: { x: 26, y: 9, z: -31 },
        },
        tags: ['wall', 'stand'],
    });

    // Advertising boards / hoarding
    registry.register({
        id: 'boards-rear',
        priority: 50,
        materialId: 'advertisingBoard',
        layer: 'board',
        shape: 'aabb',
        params: {
            min: { x: -WORLD.boardsHalfWidth, y: 0, z: WORLD.boardsZ - 0.2 },
            max: { x: WORLD.boardsHalfWidth, y: WORLD.boardsTopY, z: WORLD.boardsZ + 0.05 },
        },
        tags: ['board', 'flex'],
    });

    // Floodlight poles (from Stadium)
    const poles = [
        [-18, 14],
        [18, 14],
        [-18, -6],
        [18, -6],
    ];
    poles.forEach(([x, z], i) => {
        registry.register({
            id: `floodlight-pole-${i}`,
            priority: 60,
            materialId: 'steelPost',
            layer: 'prop',
            shape: 'cylinder',
            params: {
                axis: 'y',
                origin: { x, y: 0, z },
                radius: 0.22,
                min: 0,
                max: 14,
            },
            tags: ['prop', 'pole', 'metal'],
        });
    });

    // Corner flags — flexible plastic pole + soft flag mass
    const flags = [
        [-GOAL.width / 2 - 0.4, 0],
        [GOAL.width / 2 + 0.4, 0],
    ];
    flags.forEach(([x, z], i) => {
        registry.register({
            id: `corner-flag-${i}`,
            priority: 70,
            materialId: 'plastic',
            layer: 'prop',
            shape: 'cylinder',
            params: {
                axis: 'y',
                origin: { x, y: 0, z },
                radius: 0.04,
                min: 0,
                max: 1.5,
            },
            tags: ['prop', 'flag'],
        });
    });

    // Wire fence panel (sideline)
    registry.register({
        id: 'sideline-fence',
        priority: 55,
        materialId: 'fence',
        layer: 'fence',
        shape: 'aabb',
        params: {
            min: { x: -WORLD.boardsHalfWidth - 1, y: 0, z: WORLD.boardsZ - 4 },
            max: { x: -WORLD.boardsHalfWidth + 0.15, y: 2.2, z: WORLD.boardsZ + 2 },
        },
        tags: ['fence', 'flex'],
    });

    registered = true;

    return registry;
}

/**
 * Call before remount / hot reload if scene layout changes.
 */
export function reregisterStadiumColliders() {
    registered = false;
    const registry = getObjectRegistry();
    registry.clear();

    return registerStadiumColliders(registry);
}
