import { create } from 'zustand';
import { BALL } from '../constants/physics';
import { copy, vec3 } from '../math';

/**
 * @module store/ballStore
 * Serializable ball kinematics — simulation in BallController.
 */

export const useBallStore = create((set) => ({
    position: copy(BALL.start),
    velocity: vec3(),
    spin: vec3(),
    angularVelocity: vec3(),
    grounded: false,
    inNet: false,
    active: false,
    deform: 0,
    /** Subtle cumulative scuff / grass stain 0..0.35 */
    wear: 0,

    resetBall: () =>
        set({
            position: copy(BALL.start),
            velocity: vec3(),
            spin: vec3(),
            angularVelocity: vec3(),
            grounded: false,
            inNet: false,
            active: false,
            deform: 0,
            wear: 0,
        }),

    launch: (velocity, spin) =>
        set({
            position: copy(BALL.start),
            velocity: copy(velocity),
            spin: copy(spin),
            angularVelocity: copy(spin),
            grounded: false,
            inNet: false,
            active: true,
            deform: 0,
            // Keep wear across consecutive shots in a session
        }),

    applyState: (partial) => set(partial),
}));
