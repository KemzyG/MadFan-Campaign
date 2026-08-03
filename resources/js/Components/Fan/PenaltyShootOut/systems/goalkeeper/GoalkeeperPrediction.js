import { KEEPER_TUNING } from '../../constants/goalkeeper';
import { estimateTimeToGoalPlane, predictPosition } from '../ball/BallTrajectory';

/**
 * @module systems/goalkeeper/GoalkeeperPrediction
 * Predicts impact from ball kinematics + optional player history bias.
 */

/**
 * @param {object} args
 * @param {{ x: number, y: number, z: number }} args.position
 * @param {{ x: number, y: number, z: number }} args.velocity
 * @param {{ x: number, y: number }} args.aim
 * @param {string} args.difficulty
 * @param {Array<{ x: number, y: number, power: number }>} [args.history]
 */
export function predictImpact({ position, velocity, aim, difficulty, history = [] }) {
    const tuning = KEEPER_TUNING[difficulty] ?? KEEPER_TUNING.medium;
    const t = estimateTimeToGoalPlane(position, velocity);
    const ballistic = predictPosition(position, velocity, t);

    let biasX = 0;
    let biasY = 0;
    if (history.length >= 3) {
        const recent = history.slice(-5);
        biasX = recent.reduce((s, h) => s + h.x, 0) / recent.length;
        biasY = recent.reduce((s, h) => s + h.y, 0) / recent.length;
    }

    const accuracy = tuning.predictionAccuracy;
    const predicted = {
        x: ballistic.x * accuracy + aim.x * (1 - accuracy) * 0.35 + biasX * 0.15 * accuracy,
        y: ballistic.y * accuracy + aim.y * (1 - accuracy) * 0.25 + biasY * 0.1 * accuracy,
        z: ballistic.z,
        time: t,
    };

    return predicted;
}
