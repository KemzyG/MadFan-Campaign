/**
 * @module systems/animation/AnimationEvents
 */

/** @typedef {'kick'|'goal'|'save'|'net'|'crowdReact'|'cameraShake'|'reset'} AnimEventId */

/**
 * @param {AnimEventId} id
 * @param {Record<string, unknown>} [payload]
 */
export function createAnimEvent(id, payload = {}) {
    return { id, payload, createdAt: performance.now() };
}
