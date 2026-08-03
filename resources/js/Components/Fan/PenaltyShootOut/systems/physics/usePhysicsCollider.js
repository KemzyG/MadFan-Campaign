/**
 * Optional React helper — mount any mesh as a physics collider by describing it.
 * No object-specific response logic; only registration data.
 */
import { useEffect } from 'react';
import { getObjectRegistry } from './ObjectRegistry';

/**
 * @param {import('./ObjectRegistry').ColliderDesc|null} desc
 */
export function usePhysicsCollider(desc) {
    useEffect(() => {
        if (!desc?.id) {
            return undefined;
        }
        const registry = getObjectRegistry();
        registry.register(desc);

        return () => {
            registry.unregister(desc.id);
        };
    }, [desc]);
}
