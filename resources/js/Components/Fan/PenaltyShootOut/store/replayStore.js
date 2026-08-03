import { create } from 'zustand';
import { REPLAY_ANGLES } from '../constants/camera';

/**
 * @module store/replayStore
 */

export const useReplayStore = create((set) => ({
    active: false,
    angle: REPLAY_ANGLES.broadcast,
    elapsed: 0,
    duration: 2.4,
    ballPath: /** @type {Array<{ t: number, x: number, y: number, z: number }>} */ ([]),

    startReplay: (angle, ballPath = []) =>
        set({
            active: true,
            angle,
            elapsed: 0,
            ballPath,
            duration: 2.4,
        }),

    tick: (dt) =>
        set((s) => {
            if (!s.active) {
                return s;
            }
            const elapsed = s.elapsed + dt;
            if (elapsed >= s.duration) {
                return { active: false, elapsed: s.duration };
            }

            return { elapsed };
        }),

    stopReplay: () => set({ active: false, elapsed: 0, ballPath: [] }),
}));
