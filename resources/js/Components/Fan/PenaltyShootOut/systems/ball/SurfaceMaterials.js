import { PHYSICS } from '../../constants/physics';
import { getMaterial, LEGACY_SURFACE_TO_MATERIAL } from '../physics/MaterialDatabase';

/**
 * @module systems/ball/SurfaceMaterials
 * Bridges legacy getSurface() to the universal MaterialDatabase.
 */

/**
 * @param {string} [key]
 * @returns {{ restitution: number, friction: number, rolling: number, name: string }}
 */
export function getSurface(key) {
    const materialId = LEGACY_SURFACE_TO_MATERIAL[key] ?? key ?? PHYSICS.defaultSurface;
    const mat = getMaterial(materialId);

    return {
        restitution: mat.restitution,
        friction: mat.friction,
        /** Legacy rolling factor (1 = less resistance) */
        rolling: Math.max(0.05, 1 - mat.rollingResistance),
        name: mat.id,
    };
}

/**
 * @returns {string}
 */
export function resolvePitchSurface(rain = false, dry = false) {
    if (rain) {
        return 'wetGrass';
    }

    if (dry) {
        return 'dryGrass';
    }

    return 'grass';
}
