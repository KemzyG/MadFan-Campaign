import { KEEPER } from '../../constants/goalkeeper';
import { evaluateGoalkeeperAI } from './GoalkeeperAI';
import { poseFromState } from './GoalkeeperAnimation';
import { idleSway, stepKeeperBody } from './GoalkeeperPhysics';

/**
 * @module systems/goalkeeper/GoalkeeperController
 * Combines AI decisions with body physics for one frame.
 */

/**
 * @param {object} input
 * @param {number} input.dt
 * @param {number} input.nowMs
 * @param {string} input.phase
 * @param {string} input.difficulty
 * @param {{ x: number, y: number, z: number }} input.ballPos
 * @param {{ x: number, y: number, z: number }} input.ballVel
 * @param {{ x: number, y: number }} input.aim
 * @param {number} input.power
 * @param {object} input.keeper — current store slice
 * @param {string|null} input.lastResult
 */
export function updateGoalkeeperController(input) {
    const decision = evaluateGoalkeeperAI({
        phase: input.phase,
        difficulty: input.difficulty,
        ballPos: input.ballPos,
        ballVel: input.ballVel,
        aim: input.aim,
        power: input.power,
        history: input.keeper.playerHistory,
        reacted: input.keeper.reacted,
        reactionAtMs: input.keeper.reactionAtMs,
        nowMs: input.nowMs,
        animState: input.keeper.animState,
        lastResult: input.lastResult,
    });

    let position = { ...input.keeper.position };

    if (decision.mode === 'idle') {
        position = {
            x: idleSway(input.nowMs, position.x, input.dt),
            y: 0,
            z: KEEPER.home.z,
        };
    } else if (decision.diveTarget && (decision.mode === 'diving' || decision.mode === 'waiting')) {
        position = stepKeeperBody({
            position,
            target: decision.diveTarget,
            difficulty: input.difficulty,
            dt: input.dt,
            homeZ: KEEPER.home.z,
        });
    }

    const pose = poseFromState(decision.animState, position);

    return {
        position,
        animState: decision.animState,
        diveTarget: decision.diveTarget ?? input.keeper.diveTarget,
        reacted: decision.reacted,
        reactionAtMs: decision.reactionAtMs,
        predictedImpact: decision.predictedImpact,
        pose,
    };
}
