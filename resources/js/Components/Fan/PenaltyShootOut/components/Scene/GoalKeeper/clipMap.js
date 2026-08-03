import { LoopOnce, LoopRepeat } from 'three';
import { KEEPER_CLIP_ALIASES } from '../../../constants/goalkeeperAppearance';

/**
 * @module components/Scene/GoalKeeper/clipMap
 */

/**
 * @param {Record<string, import('three').AnimationAction|null>} actions
 * @param {string} state
 * @returns {import('three').AnimationAction|null}
 */
export function resolveClipAction(actions, state) {
    if (!actions) {
        return null;
    }
    const aliases = KEEPER_CLIP_ALIASES[state] ?? KEEPER_CLIP_ALIASES.idle;
    const names = Object.keys(actions);

    for (const alias of aliases) {
        if (actions[alias]) {
            return actions[alias];
        }
        const fuzzy = names.find((n) => n.toLowerCase() === alias.toLowerCase());
        if (fuzzy && actions[fuzzy]) {
            return actions[fuzzy];
        }
        const partial = names.find((n) => n.toLowerCase().includes(alias.toLowerCase()));
        if (partial && actions[partial]) {
            return actions[partial];
        }
    }

    const first = names[0];

    return first ? actions[first] : null;
}

/**
 * @param {Record<string, import('three').AnimationAction|null>} actions
 * @param {string} state
 * @param {import('three').AnimationAction|null} current
 * @param {number} [fade=0.25]
 */
export function fadeToState(actions, state, current, fade = 0.25) {
    const next = resolveClipAction(actions, state);
    if (!next) {
        return current;
    }
    if (current === next) {
        return current;
    }
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(fade).play();
    if (state === 'idle' || state === 'ready' || state === 'tracking' || state === 'predicting') {
        next.setLoop(LoopRepeat, Infinity);
    } else {
        next.setLoop(LoopOnce, 1);
        next.clampWhenFinished = true;
    }
    current?.fadeOut(fade);

    return next;
}
