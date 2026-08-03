import { add, dot, length, normalize, scale, sub } from '../../math';

/**
 * @module systems/physics/CollisionShapes
 * Narrow-phase contacts for registered collider shapes vs a ball sphere.
 */

/**
 * @typedef {object} Contact
 * @property {{ x: number, y: number, z: number }} normal outward from surface into ball
 * @property {number} penetration
 * @property {{ x: number, y: number, z: number }} point
 * @property {import('./ObjectRegistry').ColliderDesc} collider
 */

/**
 * Infinite plane: params { point, normal }
 *
 * @param {{ x: number, y: number, z: number }} ballPos
 * @param {number} radius
 * @param {import('./ObjectRegistry').ColliderDesc} collider
 * @returns {Contact|null}
 */
export function contactPlane(ballPos, radius, collider) {
    const n = normalize(collider.params.normal);
    const p = collider.params.point;
    const signed = dot(sub(ballPos, p), n);
    if (signed >= radius) {
        return null;
    }

    return {
        normal: n,
        penetration: radius - signed,
        point: sub(ballPos, scale(n, signed)),
        collider,
    };
}

/**
 * Infinite cylinder: params { axis: 'x'|'y'|'z', origin, radius, min?, max? }
 * Axis segment optional clamping via min/max along axis.
 *
 * @param {{ x: number, y: number, z: number }} ballPos
 * @param {number} radius
 * @param {import('./ObjectRegistry').ColliderDesc} collider
 * @returns {Contact|null}
 */
export function contactCylinder(ballPos, radius, collider) {
    const { axis, origin, radius: cylR, min = -Infinity, max = Infinity } = collider.params;
    let axisPos;
    let radial;
    let along;

    if (axis === 'y') {
        along = ballPos.y;
        axisPos = Math.max(min, Math.min(max, along));
        radial = { x: ballPos.x - origin.x, y: 0, z: ballPos.z - origin.z };
    } else if (axis === 'x') {
        along = ballPos.x;
        axisPos = Math.max(min, Math.min(max, along));
        radial = { x: 0, y: ballPos.y - origin.y, z: ballPos.z - origin.z };
    } else {
        along = ballPos.z;
        axisPos = Math.max(min, Math.min(max, along));
        radial = { x: ballPos.x - origin.x, y: ballPos.y - origin.y, z: 0 };
    }

    // Outside infinite segment clamp → no hit for finite posts
    if (along < min - radius || along > max + radius) {
        return null;
    }

    const dist = length(radial);
    const combined = cylR + radius;
    if (dist >= combined || dist < 1e-8) {
        return null;
    }

    const n = normalize(radial);
    const penetration = combined - dist;
    const point =
        axis === 'y'
            ? { x: origin.x + n.x * cylR, y: axisPos, z: origin.z + n.z * cylR }
            : axis === 'x'
              ? { x: axisPos, y: origin.y + n.y * cylR, z: origin.z + n.z * cylR }
              : { x: origin.x + n.x * cylR, y: origin.y + n.y * cylR, z: axisPos };

    return { normal: n, penetration, point, collider };
}

/**
 * AABB: params { min: Vec3, max: Vec3 }
 *
 * @param {{ x: number, y: number, z: number }} ballPos
 * @param {number} radius
 * @param {import('./ObjectRegistry').ColliderDesc} collider
 * @returns {Contact|null}
 */
export function contactAabb(ballPos, radius, collider) {
    const { min, max } = collider.params;
    const cx = Math.max(min.x, Math.min(max.x, ballPos.x));
    const cy = Math.max(min.y, Math.min(max.y, ballPos.y));
    const cz = Math.max(min.z, Math.min(max.z, ballPos.z));
    const closest = { x: cx, y: cy, z: cz };
    const delta = sub(ballPos, closest);
    const dist = length(delta);

    // Ball center inside AABB
    if (dist < 1e-8) {
        const dx = Math.min(ballPos.x - min.x, max.x - ballPos.x);
        const dy = Math.min(ballPos.y - min.y, max.y - ballPos.y);
        const dz = Math.min(ballPos.z - min.z, max.z - ballPos.z);
        let normal = { x: 0, y: 1, z: 0 };
        let penetration = radius + dy;
        if (dx <= dy && dx <= dz) {
            normal = { x: ballPos.x < (min.x + max.x) * 0.5 ? -1 : 1, y: 0, z: 0 };
            penetration = radius + dx;
        } else if (dz <= dy) {
            normal = { x: 0, y: 0, z: ballPos.z < (min.z + max.z) * 0.5 ? -1 : 1 };
            penetration = radius + dz;
        }

        return { normal, penetration, point: closest, collider };
    }

    if (dist >= radius) {
        return null;
    }

    return {
        normal: normalize(delta),
        penetration: radius - dist,
        point: closest,
        collider,
    };
}

/**
 * Sphere: params { center, radius }
 *
 * @param {{ x: number, y: number, z: number }} ballPos
 * @param {number} radius
 * @param {import('./ObjectRegistry').ColliderDesc} collider
 * @returns {Contact|null}
 */
export function contactSphere(ballPos, radius, collider) {
    const c = collider.params.center;
    const r = collider.params.radius;
    const delta = sub(ballPos, c);
    const dist = length(delta);
    const combined = r + radius;
    if (dist >= combined || dist < 1e-8) {
        return null;
    }

    return {
        normal: normalize(delta),
        penetration: combined - dist,
        point: add(c, scale(normalize(delta), r)),
        collider,
    };
}

/**
 * @param {{ x: number, y: number, z: number }} ballPos
 * @param {number} radius
 * @param {import('./ObjectRegistry').ColliderDesc} collider
 * @returns {Contact|null}
 */
export function queryContact(ballPos, radius, collider) {
    switch (collider.shape) {
        case 'plane':
            return contactPlane(ballPos, radius, collider);
        case 'cylinder':
            return contactCylinder(ballPos, radius, collider);
        case 'aabb':
            return contactAabb(ballPos, radius, collider);
        case 'sphere':
            return contactSphere(ballPos, radius, collider);
        default:
            return null;
    }
}
