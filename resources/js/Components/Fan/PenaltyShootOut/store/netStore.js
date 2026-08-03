import { create } from 'zustand';

/**
 * @module store/netStore
 * Soft-net impact / ripple state shared by physics + GoalNet mesh.
 */

export const useNetStore = create((set, get) => ({
    /** 0..1 visual shake envelope */
    ripple: 0,
    /** World-space impact point (local to goal mouth) */
    impact: { x: 0, y: 1.2, z: -16.8 },
    /** Impulse magnitude at impact */
    impulse: 0,
    /** Seconds since last impact */
    age: 0,
    active: false,

    /**
     * @param {{ x: number, y: number, z: number }} point
     * @param {number} speed
     */
    registerImpact: (point, speed) => {
        const strength = Math.min(1.4, 0.35 + speed * 0.045);

        set({
            ripple: Math.min(1, Math.max(get().ripple, strength)),
            impact: { ...point },
            impulse: strength,
            age: 0,
            active: true,
        });
    },

    /**
     * @param {number} dt
     */
    tick: (dt) => {
        const { active, ripple, age } = get();
        if (!active && ripple <= 0) {
            return;
        }
        const nextAge = age + dt;
        // Under-damped envelope: strong hit then lingering wobble
        const nextRipple = Math.max(0, ripple * Math.exp(-dt * 1.65) - dt * 0.02);
        set({
            age: nextAge,
            ripple: nextRipple,
            active: nextRipple > 0.02,
        });
    },

    reset: () =>
        set({
            ripple: 0,
            impact: { x: 0, y: 1.2, z: -16.8 },
            impulse: 0,
            age: 0,
            active: false,
        }),
}));
