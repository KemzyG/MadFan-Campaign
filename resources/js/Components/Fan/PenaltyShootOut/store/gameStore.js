import { create } from 'zustand';
import { AIM, MATCH_PHASE, SHOT } from '../constants';

/**
 * @module store/gameStore
 * Match lifecycle, scoring, difficulty, claim flag — not camera/ball/gk detail.
 */

/**
 * @typedef {import('../constants').MatchPhase} MatchPhase
 * @typedef {import('../constants/goalkeeper').Difficulty} Difficulty
 */

export const useGameStore = create((set, get) => ({
    phase: /** @type {MatchPhase} */ (MATCH_PHASE.aiming),
    previousPhase: /** @type {MatchPhase|null} */ (null),
    difficulty: /** @type {Difficulty} */ ('medium'),
    round: 1,
    shotsRemaining: 5,
    score: { player: 0, keeper: 0 },
    points: 0,
    lastPoints: 0,
    lastZone: /** @type {null|{ col: number, row: number, points: number, isCorner: boolean }} */ (null),
    goals: 0,
    misses: 0,
    saves: 0,
    lastResult: /** @type {null|'goal'|'save'|'miss'|'post'|'crossbar'} */ (null),
    aim: { x: 0, y: 1.2 },
    power: SHOT.powerMin,
    charging: false,
    claimed: false,
    paused: false,
    matchStatus: /** @type {'ready'|'live'|'ended'} */ ('ready'),

    startMatch: (initial = {}) =>
        set({
            phase: MATCH_PHASE.aiming,
            matchStatus: 'live',
            round: 1,
            shotsRemaining: 5,
            score: {
                player: Math.max(0, Number(initial.wins) || 0),
                keeper: Math.max(0, Number(initial.losses) || 0),
            },
            points: 0,
            lastPoints: 0,
            lastZone: null,
            goals: Math.max(0, Number(initial.wins) || 0),
            misses: Math.max(0, Number(initial.losses) || 0),
            saves: 0,
            lastResult: null,
            claimed: false,
            paused: false,
        }),

    restartMatch: () => get().startMatch(),

    nextPenalty: () =>
        set((s) => ({
            phase: MATCH_PHASE.aiming,
            lastResult: null,
            power: SHOT.powerMin,
            charging: false,
            aim: { x: 0, y: 1.2 },
            round: s.round + (s.lastResult ? 1 : 0),
        })),

    setAimDelta: (dx, dy) => {
        const { phase, aim, paused } = get();
        if (paused || (phase !== MATCH_PHASE.aiming && phase !== MATCH_PHASE.charging)) {
            return;
        }
        set({
            aim: {
                x: Math.min(AIM.maxX, Math.max(-AIM.maxX, aim.x + dx)),
                y: Math.min(AIM.maxY, Math.max(AIM.minY, aim.y + dy)),
            },
        });
    },

    startCharge: () => {
        const { phase, paused } = get();
        if (paused || phase !== MATCH_PHASE.aiming) {
            return;
        }
        set({ charging: true, phase: MATCH_PHASE.charging, power: SHOT.powerMin });
    },

    tickCharge: (dt) => {
        const { charging, power, phase } = get();
        if (!charging || phase !== MATCH_PHASE.charging) {
            return;
        }
        set({
            power: Math.min(SHOT.powerMax, Math.max(SHOT.powerMin, power + SHOT.chargePerSecond * dt)),
        });
    },

    beginFlight: () =>
        set((s) => ({
            phase: MATCH_PHASE.flying,
            charging: false,
            shotsRemaining: Math.max(0, s.shotsRemaining - 1),
            matchStatus: 'live',
        })),

    resolveShot: (result, earnedPoints = 0, zone = null) => {
        const { score, goals, misses, saves, points } = get();
        const isGoal = result === 'goal';
        const isSave = result === 'save';
        const shotPoints = isGoal ? Math.max(0, earnedPoints) : 0;
        set({
            phase: MATCH_PHASE.resolving,
            lastResult: result,
            lastPoints: shotPoints,
            lastZone: isGoal ? zone : null,
            points: points + shotPoints,
            score: isGoal
                ? { player: score.player + 1, keeper: score.keeper }
                : { player: score.player, keeper: score.keeper + 1 },
            goals: goals + (isGoal ? 1 : 0),
            saves: saves + (isSave ? 1 : 0),
            misses: misses + (!isGoal && !isSave ? 1 : 0),
        });
    },

    enterReplay: () => set({ phase: MATCH_PHASE.replay }),

    enterResult: () => set({ phase: MATCH_PHASE.result }),

    pauseGame: () => {
        const { phase, paused } = get();
        if (paused) {
            return;
        }
        set({ paused: true, previousPhase: phase, phase: MATCH_PHASE.paused });
    },

    resumeGame: () => {
        const { previousPhase, paused } = get();
        if (!paused) {
            return;
        }
        set({ paused: false, phase: previousPhase ?? MATCH_PHASE.aiming, previousPhase: null });
    },

    changeDifficulty: (difficulty) => set({ difficulty }),

    markClaimed: () => set({ claimed: true }),

    resetForRetry: () =>
        set({
            phase: MATCH_PHASE.aiming,
            lastResult: null,
            lastPoints: 0,
            lastZone: null,
            power: SHOT.powerMin,
            charging: false,
            aim: { x: 0, y: 1.2 },
        }),
}));
