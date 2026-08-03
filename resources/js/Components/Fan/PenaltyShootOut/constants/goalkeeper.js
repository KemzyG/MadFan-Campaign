/**
 * @module constants/goalkeeper
 */

/** @typedef {'easy'|'medium'|'hard'|'legend'} Difficulty */

export const DIFFICULTIES = Object.freeze(['easy', 'medium', 'hard', 'legend']);

export const KEEPER = Object.freeze({
    home: Object.freeze({ x: 0, y: 0, z: -15.2 }),
    reachRadius: 1.05,
    halfWidth: 0.62,
    halfHeight: 1.05,
    maxDiveX: 2.85,
    maxDiveY: 1.45,
});

export const KEEPER_TUNING = Object.freeze({
    easy: Object.freeze({
        reactionDelay: 0.32,
        diveSpeed: 3.1,
        predictionAccuracy: 0.42,
        mistakeChance: 0.38,
        fakeDiveChance: 0.18,
    }),
    medium: Object.freeze({
        reactionDelay: 0.18,
        diveSpeed: 5.0,
        predictionAccuracy: 0.62,
        mistakeChance: 0.22,
        fakeDiveChance: 0.1,
    }),
    hard: Object.freeze({
        reactionDelay: 0.09,
        diveSpeed: 7.0,
        predictionAccuracy: 0.78,
        mistakeChance: 0.1,
        fakeDiveChance: 0.05,
    }),
    legend: Object.freeze({
        reactionDelay: 0.03,
        diveSpeed: 9.0,
        predictionAccuracy: 0.9,
        mistakeChance: 0.04,
        fakeDiveChance: 0.02,
    }),
});

/**
 * @typedef {'idle'|'ready'|'tracking'|'predicting'|'diveLeft'|'diveRight'|'diveCenter'|'highSave'|'lowSave'|'recover'|'celebrate'|'disappointed'|'return'} KeeperAnimState
 */
