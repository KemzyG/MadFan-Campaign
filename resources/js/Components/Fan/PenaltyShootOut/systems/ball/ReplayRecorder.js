/**
 * @module systems/ball/ReplayRecorder
 * Records ball snapshots for cinematic replay (playback uses recordings, not recalculation).
 */

export class ReplayRecorder {
    /**
     * @param {number} [capacity=240]
     */
    constructor(capacity = 240) {
        this.capacity = capacity;
        /** @type {Array<{ t: number, state: object, event: string|null }>} */
        this.frames = [];
        this.startedAt = 0;
    }

    reset() {
        this.frames = [];
        this.startedAt = performance.now();
    }

    /**
     * @param {object} state
     * @param {string|null} [event]
     */
    push(state, event = null) {
        if (this.frames.length === 0) {
            this.startedAt = performance.now();
        }

        this.frames.push({
            t: performance.now() - this.startedAt,
            state: {
                position: { ...state.position },
                velocity: { ...state.velocity },
                spin: { ...state.spin },
                angularVelocity: { ...state.angularVelocity },
                grounded: state.grounded,
                inNet: state.inNet,
                deform: state.deform ?? 0,
            },
            event,
        });

        if (this.frames.length > this.capacity) {
            this.frames.shift();
        }
    }

    /**
     * @returns {ReadonlyArray<{ t: number, state: object, event: string|null }>}
     */
    snapshot() {
        return this.frames.slice();
    }
}
