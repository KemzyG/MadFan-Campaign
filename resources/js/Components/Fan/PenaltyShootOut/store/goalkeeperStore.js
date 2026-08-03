import { create } from 'zustand';
import { KEEPER } from '../constants/goalkeeper';

/**
 * @module store/goalkeeperStore
 */

export const useGoalkeeperStore = create((set) => ({
    position: { x: KEEPER.home.x, y: KEEPER.home.y, z: KEEPER.home.z },
    velocity: { x: 0, y: 0, z: 0 },
    animState: /** @type {import('../constants/goalkeeper').KeeperAnimState} */ ('idle'),
    diveTarget: { x: 0, y: 0 },
    reacted: false,
    reactionAtMs: null,
    predictedImpact: null,
    playerHistory: /** @type {Array<{ x: number, y: number, power: number }>} */ ([]),

    resetKeeper: () =>
        set({
            position: { x: KEEPER.home.x, y: KEEPER.home.y, z: KEEPER.home.z },
            velocity: { x: 0, y: 0, z: 0 },
            animState: 'idle',
            diveTarget: { x: 0, y: 0 },
            reacted: false,
            reactionAtMs: null,
            predictedImpact: null,
        }),

    apply: (partial) => set(partial),

    recordShotTendency: (shot) =>
        set((s) => ({
            playerHistory: [...s.playerHistory.slice(-12), shot],
        })),
}));
