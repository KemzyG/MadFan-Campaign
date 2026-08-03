import { useEffect, useRef } from 'react';
import { MATCH_PHASE } from '../constants';
import { resetAnimationManager } from '../systems/animation/AnimationManager';
import { useBallStore } from '../store/ballStore';
import { useCameraStore } from '../store/cameraStore';
import { useGameStore } from '../store/gameStore';
import { useGoalkeeperStore } from '../store/goalkeeperStore';
import { useNetStore } from '../store/netStore';
import { useReplayStore } from '../store/replayStore';
import { useStatsStore } from '../store/statsStore';

/**
 * @module hooks/useMatchLifecycle
 *
 * Unlimited free play. First goal fires host onScore once (daily claim).
 * Every goal fires onWinPoints with zone points for the real balance credit.
 */

const AUTO_RESET_MS = {
    goal: 500,
    miss: 350,
};

/**
 * @param {{
 *   scored?: boolean,
 *   disabled?: boolean,
 *   onScore?: () => void,
 *   onWinPoints?: (payload: { points: number, zone: object|null }) => void,
 *   onLoss?: (payload: { result: string }) => void,
 *   freePlay?: boolean,
 * }} options
 */
export function useMatchLifecycle({
    scored = false,
    disabled = false,
    onScore,
    onWinPoints,
    onLoss,
    freePlay = true,
    initialWins = 0,
    initialLosses = 0,
}) {
    const claimedHost = useRef(Boolean(scored));
    const disabledRef = useRef(disabled);
    const onScoreRef = useRef(onScore);
    const onWinPointsRef = useRef(onWinPoints);
    const onLossRef = useRef(onLoss);
    onScoreRef.current = onScore;
    onWinPointsRef.current = onWinPoints;
    onLossRef.current = onLoss;
    disabledRef.current = disabled;

    useEffect(() => {
        resetAnimationManager();
        useStatsStore.getState().resetStats();
        useReplayStore.getState().stopReplay();
        useBallStore.getState().resetBall();
        useGoalkeeperStore.getState().resetKeeper();
        useCameraStore.getState().resetOrbit();
        useNetStore.getState().reset();
        useGameStore.getState().startMatch({
            wins: initialWins,
            losses: initialLosses,
        });

        if (scored) {
            claimedHost.current = true;
            useGameStore.getState().markClaimed();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only boot
    }, []);

    useEffect(() => {
        if (scored) {
            claimedHost.current = true;
            useGameStore.getState().markClaimed();
        }
    }, [scored]);

    useEffect(() => {
        let lastPhase = useGameStore.getState().phase;

        return useGameStore.subscribe((state) => {
            const enteredResult =
                state.phase === MATCH_PHASE.result && lastPhase !== MATCH_PHASE.result;
            lastPhase = state.phase;

            if (!enteredResult || disabledRef.current) {
                return;
            }

            if (state.lastResult === 'goal') {
                if (state.lastPoints > 0) {
                    try {
                        onWinPointsRef.current?.({
                            points: state.lastPoints,
                            zone: state.lastZone,
                        });
                    } catch {
                        // Balance credit must never break free play
                    }
                }

                if (!state.claimed && !claimedHost.current) {
                    claimedHost.current = true;
                    useGameStore.getState().markClaimed();
                    try {
                        onScoreRef.current?.();
                    } catch {
                        // Claim must never break free play
                    }
                }

                return;
            }

            if (state.lastResult) {
                try {
                    onLossRef.current?.({ result: state.lastResult });
                } catch {
                    // Day loss tally must never break free play
                }
            }
        });
    }, []);

    useEffect(() => {
        let timer = /** @type {ReturnType<typeof setTimeout>|null} */ (null);
        let lastPhase = useGameStore.getState().phase;

        const unsub = useGameStore.subscribe((state) => {
            const enteredResult =
                state.phase === MATCH_PHASE.result && lastPhase !== MATCH_PHASE.result;
            lastPhase = state.phase;

            if (!enteredResult || disabledRef.current) {
                return;
            }

            if (timer) {
                clearTimeout(timer);
            }

            const delay = state.lastResult === 'goal' ? AUTO_RESET_MS.goal : AUTO_RESET_MS.miss;
            timer = setTimeout(() => {
                if (disabledRef.current) {
                    return;
                }
                retryPenalty();
                timer = null;
            }, delay);
        });

        return () => {
            if (timer) {
                clearTimeout(timer);
            }
            unsub();
        };
    }, []);

    void freePlay;
    void disabled;
}

export function retryPenalty() {
    useReplayStore.getState().stopReplay();
    useBallStore.getState().resetBall();
    useGoalkeeperStore.getState().resetKeeper();
    useCameraStore.getState().resetOrbit();
    useNetStore.getState().reset();
    useGameStore.getState().resetForRetry();
}
