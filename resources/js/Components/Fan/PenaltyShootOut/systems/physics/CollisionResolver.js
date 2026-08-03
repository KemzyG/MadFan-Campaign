import { add, dot, scale, sub } from '../../math';
import { getMaterial } from './MaterialDatabase';

/**
 * @module systems/physics/CollisionResolver
 * Material-driven bounce — no object-specific branches.
 */

/**
 * @param {{ x: number, y: number, z: number }} velocity
 * @param {{ x: number, y: number, z: number }} spin
 * @param {import('./CollisionShapes').Contact} contact
 * @returns {{
 *   velocity: { x: number, y: number, z: number },
 *   spin: { x: number, y: number, z: number },
 *   impulse: number,
 *   hit: boolean,
 *   material: import('./MaterialDatabase').PhysicsMaterial,
 * }}
 */
export function resolveContact(velocity, spin, contact) {
    const material = getMaterial(contact.collider.materialId);
    const n = contact.normal;
    const vn = dot(velocity, n);

    // Separating or grazing — skip
    if (vn >= -1e-4) {
        return { velocity, spin, impulse: 0, hit: false, material };
    }

    const vNormal = scale(n, vn);
    const vTangent = sub(velocity, vNormal);

    const restitution = Math.max(0, material.restitution * (1 - material.energyLoss * 0.35));
    const friction = Math.max(0.05, Math.min(1, material.friction * (1 - material.roughness * 0.15)));

    let nextVel = add(scale(vNormal, -restitution), scale(vTangent, friction));

    // Soft flex surfaces (boards/fence/net) push slightly along normal after absorb
    if (material.deformationAmount > 0.05 && material.hardness < 0.5) {
        nextVel = add(nextVel, scale(n, Math.abs(vn) * material.deformationAmount * 0.15));
    }

    // Spin transfer / bleed from friction
    const spinDamp = 1 - Math.min(0.45, material.absorption * 0.5 + (1 - friction) * 0.2);
    const nextSpin = {
        x: spin.x * spinDamp,
        y: spin.y * spinDamp,
        z: spin.z * spinDamp,
    };

    // Tangential kick from remaining sidespin
    nextVel.x += spin.y * 0.035 * Math.abs(vn) * (1 - material.absorption);
    nextVel.z -= spin.x * 0.03 * Math.abs(vn) * (1 - material.absorption);

    return {
        velocity: nextVel,
        spin: nextSpin,
        impulse: Math.abs(vn),
        hit: true,
        material,
    };
}

/**
 * Separating positional correction.
 *
 * @param {{ x: number, y: number, z: number }} position
 * @param {import('./CollisionShapes').Contact} contact
 */
export function separateContact(position, contact) {
    return add(position, scale(contact.normal, contact.penetration + 1e-4));
}
