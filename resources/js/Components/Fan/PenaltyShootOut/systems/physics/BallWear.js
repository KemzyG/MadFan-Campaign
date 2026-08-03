/**
 * @module systems/physics/BallWear
 * Subtle cumulative surface wear — grass/mud/scuff from materials.
 */

/**
 * @param {number} wear 0..1
 * @param {import('./MaterialDatabase').PhysicsMaterial} material
 * @param {number} impulse
 */
export function accumulateWear(wear, material, impulse) {
    const base = material.particleEffect === 'mud' ? 0.004 : material.roughness * 0.0015;
    const next = wear + base * Math.min(20, Math.max(0, impulse));

    return Math.min(0.35, next);
}

/**
 * Tint / roughness hints for shaders (subtle).
 *
 * @param {number} wear 0..1
 */
export function wearVisual(wear) {
    const w = Math.max(0, Math.min(1, wear));

    return {
        roughnessBoost: w * 0.25,
        dirtMix: w * 0.18,
        colorMix: w * 0.12,
    };
}
