import { AnimationController } from './AnimationController';

/**
 * @module systems/animation/AnimationManager
 * Singleton-style facade — components never own raw queues.
 */

let instance = null;

export function getAnimationManager() {
    if (!instance) {
        instance = new AnimationController();
    }

    return instance;
}

export function resetAnimationManager() {
    instance = new AnimationController();

    return instance;
}
