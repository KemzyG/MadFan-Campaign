import { add, dot, length, scale, sub } from '../../math';

/**
 * @module systems/ball/BounceResolver
 * Elastic + frictional collision response against a surface normal.
 */

/**
 * @param {{ x: number, y: number, z: number }} velocity
 * @param {{ x: number, y: number, z: number }} normal unit outward from surface
 * @param {{ restitution: number, friction: number }} material
 * @param {{ x: number, y: number, z: number }} [spin]
 * @returns {{
 *   velocity: { x: number, y: number, z: number },
 *   spin: { x: number, y: number, z: number },
 *   impulse: number,
 *   hit: boolean,
 * }}
 */
export function resolveBounce(velocity, normal, material, spin = { x: 0, y: 0, z: 0 }) {
    const vn = dot(velocity, normal);
    if (vn >= -1e-4) {
        return { velocity, spin, impulse: 0, hit: false };
    }

    const vNormal = scale(normal, vn);
    const vTangent = sub(velocity, vNormal);

    // Reverse normal component with restitution; bleed tangential via friction
    const bouncedNormal = scale(vNormal, -material.restitution);
    const bouncedTangent = scale(vTangent, material.friction);
    const nextVel = add(bouncedNormal, bouncedTangent);

    // Spin couples slightly into the tangent plane (topspin digs, sidespin kicks)
    const nextSpin = {
        x: spin.x * (0.82 + material.friction * 0.1),
        y: spin.y * (0.75 + material.friction * 0.12),
        z: spin.z * (0.82 + material.friction * 0.1),
    };

    // Tangential kick from sidespin on bounce
    nextVel.x += spin.y * 0.04 * Math.abs(vn);
    nextVel.z -= spin.x * 0.03 * Math.abs(vn);

    return {
        velocity: nextVel,
        spin: nextSpin,
        impulse: Math.abs(vn),
        hit: true,
    };
}

/**
 * Infinite cylinder collision in a 2D plane (axis orthogonal to plane).
 *
 * @param {{ x: number, y: number }} point2
 * @param {{ x: number, y: number }} center2
 * @param {number} combinedRadius
 */
export function cylinderHit2D(point2, center2, combinedRadius) {
    const dx = point2.x - center2.x;
    const dy = point2.y - center2.y;
    const dist = Math.hypot(dx, dy);
    if (dist >= combinedRadius || dist < 1e-8) {
        return null;
    }

    const nx = dx / dist;
    const ny = dy / dist;
    const penetration = combinedRadius - dist;

    return { nx, ny, penetration, dist };
}

/**
 * @param {{ x: number, y: number, z: number }} velocity
 */
export function impactSpeed(velocity) {
    return length(velocity);
}
