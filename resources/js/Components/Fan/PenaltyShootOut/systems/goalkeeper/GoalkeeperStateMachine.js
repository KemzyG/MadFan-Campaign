/**
 * @module systems/goalkeeper/GoalkeeperStateMachine
 */

const TRANSITIONS = {
    idle: ['ready', 'idle'],
    ready: ['tracking', 'predicting', 'idle'],
    tracking: ['predicting', 'diveLeft', 'diveRight', 'diveCenter', 'highSave', 'lowSave'],
    predicting: ['diveLeft', 'diveRight', 'diveCenter', 'highSave', 'lowSave'],
    diveLeft: ['recover', 'celebrate', 'disappointed'],
    diveRight: ['recover', 'celebrate', 'disappointed'],
    diveCenter: ['recover', 'celebrate', 'disappointed'],
    highSave: ['recover', 'celebrate', 'disappointed'],
    lowSave: ['recover', 'celebrate', 'disappointed'],
    recover: ['return', 'idle'],
    celebrate: ['return', 'idle'],
    disappointed: ['return', 'idle'],
    return: ['idle', 'ready'],
};

/**
 * @param {string} from
 * @param {string} to
 */
export function canEnter(from, to) {
    return (TRANSITIONS[from] ?? []).includes(to);
}

/**
 * @param {string} current
 * @param {string} next
 */
export function transition(current, next) {
    if (current === next || canEnter(current, next)) {
        return next;
    }

    return current;
}

/**
 * Map dive target to anim state.
 *
 * @param {{ x: number, y: number }} target
 * @param {boolean} reacted
 */
export function diveStateFromTarget(target, reacted) {
    if (!reacted) {
        return 'ready';
    }
    if (target.y > 1.05) {
        return 'highSave';
    }
    if (target.y < 0.35) {
        return 'lowSave';
    }
    if (target.x < -0.45) {
        return 'diveLeft';
    }
    if (target.x > 0.45) {
        return 'diveRight';
    }

    return 'diveCenter';
}
