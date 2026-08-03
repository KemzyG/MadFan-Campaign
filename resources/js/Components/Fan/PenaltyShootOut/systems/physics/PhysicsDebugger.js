/**
 * @module systems/physics/PhysicsDebugger
 * Optional overlay of registered colliders for tuning.
 */

/**
 * @param {import('./ObjectRegistry').ObjectRegistry} registry
 * @returns {Array<{ id: string, shape: string, materialId: string, priority: number, tags: string[] }>}
 */
export function dumpColliders(registry) {
    return registry.list().map((c) => ({
        id: c.id,
        shape: c.shape,
        materialId: c.materialId,
        priority: c.priority ?? 50,
        tags: c.tags ?? [],
        layer: c.layer ?? 'prop',
    }));
}

/**
 * @param {boolean} enabled
 * @param {() => void} fn
 */
export function debugPhysics(enabled, fn) {
    if (enabled) {
        fn();
    }
}
