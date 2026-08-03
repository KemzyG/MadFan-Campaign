import { CAMERA_MODES } from '../../constants/camera';
import { MATCH_PHASE } from '../../constants';

/**
 * @module systems/camera/CameraStateMachine
 * Maps match phase → camera mode. Pure transition table.
 */

/**
 * @param {string} phase
 * @param {{ lastResult?: string|null, replayActive?: boolean }} context
 * @returns {string}
 */
export function resolveCameraMode(phase, context = {}) {
    if (context.replayActive) {
        return CAMERA_MODES.replay;
    }

    switch (phase) {
        case MATCH_PHASE.idle:
            return CAMERA_MODES.idle;
        case MATCH_PHASE.aiming:
        case MATCH_PHASE.charging:
            return CAMERA_MODES.aim;
        case MATCH_PHASE.flying:
        case MATCH_PHASE.resolving:
            return CAMERA_MODES.kick;
        case MATCH_PHASE.replay:
            return CAMERA_MODES.replay;
        case MATCH_PHASE.result:
            if (context.lastResult === 'goal') {
                return CAMERA_MODES.goal;
            }
            if (context.lastResult === 'save') {
                return CAMERA_MODES.save;
            }

            return CAMERA_MODES.kick;
        default:
            return CAMERA_MODES.idle;
    }
}

/**
 * @param {string} from
 * @param {string} to
 */
export function canTransition(from, to) {
    if (from === to) {
        return false;
    }

    return Object.values(CAMERA_MODES).includes(to);
}
