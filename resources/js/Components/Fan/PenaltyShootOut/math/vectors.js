/**
 * @module math/vectors
 * @description Lightweight 3D vector ops (no Three.js dependency in domain layer).
 */

/**
 * @typedef {{ x: number, y: number, z: number }} Vec3
 */

/** @returns {Vec3} */
export function vec3(x = 0, y = 0, z = 0) {
    return { x, y, z };
}

/** @param {Vec3} a @param {Vec3} b @returns {Vec3} */
export function add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

/** @param {Vec3} a @param {Vec3} b @returns {Vec3} */
export function sub(a, b) {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

/** @param {Vec3} a @param {number} s @returns {Vec3} */
export function scale(a, s) {
    return { x: a.x * s, y: a.y * s, z: a.z * s };
}

/** @param {Vec3} a @returns {number} */
export function length(a) {
    return Math.hypot(a.x, a.y, a.z);
}

/** @param {Vec3} a @returns {Vec3} */
export function normalize(a) {
    const len = length(a) || 1;

    return { x: a.x / len, y: a.y / len, z: a.z / len };
}

/** @param {Vec3} a @param {Vec3} b @returns {number} */
export function dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

/** @param {Vec3} a @param {Vec3} b @returns {Vec3} */
export function cross(a, b) {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x,
    };
}

/** @param {Vec3} a @param {Vec3} b @param {number} t @returns {Vec3} */
export function lerp3(a, b, t) {
    return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        z: a.z + (b.z - a.z) * t,
    };
}

/** @param {Vec3} a @returns {Vec3} */
export function copy(a) {
    return { x: a.x, y: a.y, z: a.z };
}
