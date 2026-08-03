/**
 * @module systems/animation/AnimationQueue
 * FIFO of timed animation events for blend scheduling.
 */

export class AnimationQueue {
    constructor() {
        /** @type {Array<{ id: string, payload: object, at: number, duration: number }>} */
        this.items = [];
    }

    /**
     * @param {string} id
     * @param {object} [payload]
     * @param {number} [duration=0.4]
     * @param {number} [delay=0]
     */
    enqueue(id, payload = {}, duration = 0.4, delay = 0) {
        this.items.push({
            id,
            payload,
            at: performance.now() + delay * 1000,
            duration,
        });
    }

    /**
     * @param {number} nowMs
     */
    peekActive(nowMs) {
        return this.items.filter((item) => nowMs >= item.at && nowMs <= item.at + item.duration * 1000);
    }

    /**
     * @param {number} nowMs
     */
    prune(nowMs) {
        this.items = this.items.filter((item) => nowMs <= item.at + item.duration * 1000 + 50);
    }

    clear() {
        this.items = [];
    }
}
