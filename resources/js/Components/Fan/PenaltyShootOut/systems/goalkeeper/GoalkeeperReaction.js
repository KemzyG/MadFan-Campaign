import { KEEPER, KEEPER_TUNING } from '../../constants/goalkeeper';

/**
 * @module systems/goalkeeper/GoalkeeperReaction
 * Reaction delay, mistakes, fake dives — human-like variance.
 */

/**
 * @param {string} difficulty
 * @param {number} nowMs
 */
export function scheduleReaction(difficulty, nowMs) {
    const tuning = KEEPER_TUNING[difficulty] ?? KEEPER_TUNING.medium;
    const jitter = (Math.random() * 0.06 - 0.02) * 1000;

    return nowMs + tuning.reactionDelay * 1000 + jitter;
}

/**
 * @param {{ x: number, y: number }} predicted
 * @param {string} difficulty
 */
export function decideDiveTarget(predicted, difficulty) {
    const tuning = KEEPER_TUNING[difficulty] ?? KEEPER_TUNING.medium;
    let x = predicted.x;
    let y = Math.max(0, predicted.y - 0.9);

    if (Math.random() < tuning.mistakeChance) {
        x += (Math.random() > 0.5 ? 1 : -1) * (1.1 + Math.random() * 1.4);
        y += (Math.random() - 0.5) * 0.8;
    }

    if (Math.random() < tuning.fakeDiveChance) {
        x = -Math.sign(x || 1) * (1.5 + Math.random());
    }

    return {
        x: Math.max(-KEEPER.maxDiveX, Math.min(KEEPER.maxDiveX, x)),
        y: Math.max(0, Math.min(KEEPER.maxDiveY, y)),
    };
}

/**
 * Legend difficulty reads charge / aim drift.
 *
 * @param {{ x: number, y: number }} aim
 * @param {number} power
 * @param {string} difficulty
 */
export function preReadBias(aim, power, difficulty) {
    if (difficulty !== 'legend') {
        return { x: 0, y: 0 };
    }

    return {
        x: aim.x * 0.12,
        y: (aim.y - 1) * 0.08 * power,
    };
}
