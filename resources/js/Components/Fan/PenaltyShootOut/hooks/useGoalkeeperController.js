import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { MATCH_PHASE } from '../constants';
import { updateGoalkeeperController } from '../systems/goalkeeper/GoalkeeperController';
import { useBallStore } from '../store/ballStore';
import { useGameStore } from '../store/gameStore';
import { useGoalkeeperStore } from '../store/goalkeeperStore';
import { useReplayStore } from '../store/replayStore';

/**
 * @module hooks/useGoalkeeperController
 */

export function useGoalkeeperController() {
    const poseRef = useRef({ lean: 0, yaw: 0, armRaise: 0.15, crouch: 0 });

    useFrame((_, dt) => {
        const game = useGameStore.getState();
        if (game.paused) {
            return;
        }

        const ball = useBallStore.getState();
        const keeper = useGoalkeeperStore.getState();
        const next = updateGoalkeeperController({
            dt: Math.min(dt, 0.033),
            nowMs: performance.now(),
            phase: game.phase,
            difficulty: game.difficulty,
            ballPos: ball.position,
            ballVel: ball.velocity,
            aim: game.aim,
            power: game.power,
            keeper,
            lastResult: game.lastResult,
        });

        useGoalkeeperStore.getState().apply({
            position: next.position,
            animState: next.animState,
            diveTarget: next.diveTarget,
            reacted: next.reacted,
            reactionAtMs: next.reactionAtMs,
            predictedImpact: next.predictedImpact,
        });
        poseRef.current = next.pose;

        const replay = useReplayStore.getState();
        if (game.phase === MATCH_PHASE.replay && replay.active) {
            useReplayStore.getState().tick(dt);
            if (!useReplayStore.getState().active) {
                useGameStore.getState().enterResult();
            }
        }
    });

    return poseRef;
}
