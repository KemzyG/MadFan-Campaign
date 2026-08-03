import { AnimationQueue } from './AnimationQueue';
import { blendToward } from './AnimationMixer';

/**
 * @module systems/animation/AnimationController
 * Per-domain animation weights driven by match events.
 */

export class AnimationController {
    constructor() {
        this.queue = new AnimationQueue();
        this.weights = {
            crowd: 0.2,
            net: 0,
            celebrate: 0,
            shake: 0,
        };
    }

    /** @param {string} id @param {object} [payload] */
    trigger(id, payload = {}) {
        const duration = id === 'goal' || id === 'celebrate' ? 1.2 : 0.45;
        this.queue.enqueue(id, payload, duration);
        if (id === 'goal' || id === 'crowdReact') {
            this.weights.crowd = 1;
            this.weights.celebrate = 1;
        }
        if (id === 'net') {
            this.weights.net = 1;
        }
        if (id === 'cameraShake' || id === 'save' || id === 'post') {
            this.weights.shake = 1;
        }
    }

    /**
     * @param {number} dt
     * @param {number} nowMs
     */
    update(dt, nowMs) {
        this.queue.prune(nowMs);
        this.weights.crowd = blendToward(this.weights.crowd, 0.2, dt * 0.8);
        this.weights.net = blendToward(this.weights.net, 0, dt * 0.85);
        this.weights.celebrate = blendToward(this.weights.celebrate, 0, dt * 0.7);
        this.weights.shake = blendToward(this.weights.shake, 0, dt * 3);
    }
}
