/**
 * @module systems/physics/ObjectRegistry
 * Scene colliders register once; the engine never special-cases object names.
 */

/**
 * @typedef {'plane'|'cylinder'|'aabb'|'sphere'} ColliderShapeType
 *
 * @typedef {object} ColliderDesc
 * @property {string} id
 * @property {boolean} [enabled=true]
 * @property {number} [priority=50] lower runs first
 * @property {string} materialId
 * @property {ColliderShapeType} shape
 * @property {object} params shape-specific
 * @property {string[]} [tags]
 * @property {string} [layer]
 */

export class ObjectRegistry {
    constructor() {
        /** @type {Map<string, ColliderDesc>} */
        this.colliders = new Map();
    }

    /**
     * @param {ColliderDesc} desc
     */
    register(desc) {
        this.colliders.set(desc.id, {
            enabled: true,
            priority: 50,
            tags: [],
            layer: 'prop',
            ...desc,
        });

        return desc.id;
    }

    /**
     * @param {string} id
     */
    unregister(id) {
        this.colliders.delete(id);
    }

    /**
     * @param {string} id
     * @param {boolean} enabled
     */
    setEnabled(id, enabled) {
        const c = this.colliders.get(id);
        if (c) {
            c.enabled = enabled;
        }
    }

    /**
     * @param {string} id
     * @param {Partial<ColliderDesc>} patch
     */
    update(id, patch) {
        const c = this.colliders.get(id);
        if (!c) {
            return;
        }
        Object.assign(c, patch);
    }

    clear() {
        this.colliders.clear();
    }

    /**
     * @returns {ColliderDesc[]}
     */
    list() {
        return [...this.colliders.values()]
            .filter((c) => c.enabled)
            .sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50));
    }

    /**
     * @param {string} tag
     */
    listByTag(tag) {
        return this.list().filter((c) => c.tags?.includes(tag));
    }
}

/** Shared stadium registry singleton */
let sharedRegistry = null;

export function getObjectRegistry() {
    if (!sharedRegistry) {
        sharedRegistry = new ObjectRegistry();
    }

    return sharedRegistry;
}

export function resetObjectRegistry() {
    sharedRegistry = new ObjectRegistry();

    return sharedRegistry;
}
