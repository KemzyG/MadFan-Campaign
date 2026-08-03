/**
 * @module store/createSelectors
 * Prefer selectors over whole-store subscriptions to avoid HUD thrashing.
 */

/**
 * @template T
 * @param {import('zustand').StoreApi<T>} store
 * @param {(state: T) => unknown} selector
 */
export function select(store, selector) {
    return store(selector);
}
