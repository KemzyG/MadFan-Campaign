import { create } from 'zustand';

/**
 * @module store/statsStore
 */

export const useStatsStore = create((set) => ({
    shotsTaken: 0,
    goals: 0,
    saves: 0,
    posts: 0,
    misses: 0,
    avgPower: 0,
    powerSum: 0,

    recordShot: ({ result, power }) =>
        set((s) => {
            const shotsTaken = s.shotsTaken + 1;
            const powerSum = s.powerSum + power;

            return {
                shotsTaken,
                powerSum,
                avgPower: powerSum / shotsTaken,
                goals: s.goals + (result === 'goal' ? 1 : 0),
                saves: s.saves + (result === 'save' ? 1 : 0),
                posts: s.posts + (result === 'post' || result === 'crossbar' ? 1 : 0),
                misses: s.misses + (result === 'miss' ? 1 : 0),
            };
        }),

    resetStats: () =>
        set({
            shotsTaken: 0,
            goals: 0,
            saves: 0,
            posts: 0,
            misses: 0,
            avgPower: 0,
            powerSum: 0,
        }),
}));
