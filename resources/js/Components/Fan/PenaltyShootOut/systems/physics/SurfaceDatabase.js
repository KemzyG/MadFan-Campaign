/**
 * @module systems/physics/SurfaceDatabase
 * Alias over MaterialDatabase pitch surfaces for API completeness.
 */
import { getMaterial, listMaterials, registerMaterial } from './MaterialDatabase';

const SURFACE_KEYS = ['grass', 'wetGrass', 'dryGrass', 'turf', 'concrete'];

/**
 * @param {string} id
 */
export function getSurfaceMaterial(id) {
    return getMaterial(id);
}

export function listSurfaceMaterials() {
    const all = listMaterials();

    return Object.fromEntries(SURFACE_KEYS.filter((k) => all[k]).map((k) => [k, all[k]]));
}

export { registerMaterial as registerSurfaceMaterial };
