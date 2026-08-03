export * from './physics';
export * from './camera';
export * from './goalkeeper';
export * from './audio';

/** @typedef {'idle'|'aiming'|'charging'|'flying'|'resolving'|'replay'|'result'|'paused'} MatchPhase */

export const MATCH_PHASE = Object.freeze({
    idle: 'idle',
    aiming: 'aiming',
    charging: 'charging',
    flying: 'flying',
    resolving: 'resolving',
    replay: 'replay',
    result: 'result',
    paused: 'paused',
});
