import { REPLAY_ANGLES } from '../../constants/camera';
import { GOAL } from '../../constants/physics';

/**
 * @module systems/camera/ReplayCamera
 * Cinematic angles; auto-picks based on shot result / ball path.
 */

/**
 * @param {{ result: string|null, ball: { x: number, y: number, z: number } }} ctx
 * @returns {keyof typeof REPLAY_ANGLES extends never ? string : string}
 */
export function pickReplayAngle(ctx) {
    const { result, ball } = ctx;

    if (result === 'save') {
        return REPLAY_ANGLES.keeper;
    }
    if (result === 'goal' && Math.abs(ball.x) > 2.2) {
        return REPLAY_ANGLES.goalLine;
    }
    if (result === 'goal') {
        return REPLAY_ANGLES.broadcast;
    }
    if (Math.abs(ball.x) > 1.5) {
        return REPLAY_ANGLES.side;
    }

    return REPLAY_ANGLES.behindShooter;
}

/**
 * @param {string} angle
 * @param {{ x: number, y: number, z: number }} ball
 * @param {{ x: number, y: number, z: number }} keeper
 */
export function replayPose(angle, ball, keeper) {
    switch (angle) {
        case REPLAY_ANGLES.side:
            return {
                position: { x: Math.sign(ball.x || 1) * 8.5, y: 2.2, z: (ball.z + GOAL.z) * 0.5 },
                lookAt: { x: ball.x, y: ball.y, z: ball.z },
            };
        case REPLAY_ANGLES.goalLine:
            return {
                position: { x: ball.x * 0.3, y: 1.4, z: GOAL.z + 0.8 },
                lookAt: { x: ball.x, y: 1.1, z: ball.z },
            };
        case REPLAY_ANGLES.keeper:
            return {
                position: { x: keeper.x, y: keeper.y + 1.6, z: keeper.z + 0.4 },
                lookAt: { x: ball.x, y: ball.y, z: ball.z },
            };
        case REPLAY_ANGLES.broadcast:
            return {
                position: { x: 0, y: 6.5, z: 6 },
                lookAt: { x: 0, y: 1.2, z: GOAL.z },
            };
        case REPLAY_ANGLES.behindShooter:
        default:
            return {
                position: { x: 0, y: 2.4, z: 14.5 },
                lookAt: { x: ball.x * 0.4, y: 1.2, z: GOAL.z },
            };
    }
}
