import { predictImpact } from './GoalkeeperPrediction';
import { decideDiveTarget, preReadBias, scheduleReaction } from './GoalkeeperReaction';
import { diveStateFromTarget, transition } from './GoalkeeperStateMachine';

/**
 * @module systems/goalkeeper/GoalkeeperAI
 * Decision layer: when to react and where to dive.
 */

/**
 * @param {object} ctx
 * @param {string} ctx.phase
 * @param {string} ctx.difficulty
 * @param {{ x: number, y: number, z: number }} ctx.ballPos
 * @param {{ x: number, y: number, z: number }} ctx.ballVel
 * @param {{ x: number, y: number }} ctx.aim
 * @param {number} ctx.power
 * @param {Array} ctx.history
 * @param {boolean} ctx.reacted
 * @param {number|null} ctx.reactionAtMs
 * @param {number} ctx.nowMs
 * @param {string} ctx.animState
 * @param {string|null} ctx.lastResult
 */
export function evaluateGoalkeeperAI(ctx) {
    if (ctx.phase === 'aiming' || ctx.phase === 'charging') {
        const bias = preReadBias(ctx.aim, ctx.power, ctx.difficulty);

        return {
            animState: transition(ctx.animState, ctx.phase === 'charging' ? 'ready' : 'idle'),
            diveTarget: { x: bias.x, y: Math.max(0, bias.y) },
            reacted: false,
            reactionAtMs: null,
            predictedImpact: null,
            mode: 'idle',
        };
    }

    if (ctx.phase === 'result' || ctx.phase === 'resolving' || ctx.phase === 'replay') {
        const anim =
            ctx.lastResult === 'goal' ? 'disappointed' : ctx.lastResult === 'save' ? 'celebrate' : 'recover';

        return {
            animState: transition(ctx.animState, anim),
            diveTarget: null,
            reacted: ctx.reacted,
            reactionAtMs: ctx.reactionAtMs,
            predictedImpact: null,
            mode: 'aftermath',
        };
    }

    if (ctx.phase !== 'flying') {
        return {
            animState: ctx.animState,
            diveTarget: null,
            reacted: ctx.reacted,
            reactionAtMs: ctx.reactionAtMs,
            predictedImpact: null,
            mode: 'hold',
        };
    }

    let reactionAtMs = ctx.reactionAtMs;
    if (reactionAtMs == null) {
        reactionAtMs = scheduleReaction(ctx.difficulty, ctx.nowMs);
    }

    const predicted = predictImpact({
        position: ctx.ballPos,
        velocity: ctx.ballVel,
        aim: ctx.aim,
        difficulty: ctx.difficulty,
        history: ctx.history,
    });

    if (ctx.nowMs < reactionAtMs) {
        return {
            animState: transition(ctx.animState, 'tracking'),
            diveTarget: { x: 0, y: 0 },
            reacted: false,
            reactionAtMs,
            predictedImpact: predicted,
            mode: 'waiting',
        };
    }

    const diveTarget = decideDiveTarget(predicted, ctx.difficulty);
    const animState = diveStateFromTarget(diveTarget, true);

    return {
        animState: transition(ctx.animState, animState),
        diveTarget,
        reacted: true,
        reactionAtMs,
        predictedImpact: predicted,
        mode: 'diving',
    };
}
