import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { MATCH_PHASE } from '../constants';
import { getAnimationManager } from '../systems/animation/AnimationManager';
import { getAudioManager } from '../systems/audio/AudioManager';
import { getBallReplayRecorder, stepBallSimulation } from '../systems/ball/BallController';
import { idleBallSpin, stepBallRotation } from '../systems/ball/BallAnimator';
import { scoreGoalZone } from '../systems/ball/GoalZones';
import { accumulateWear } from '../systems/physics/BallWear';
import { getMaterial } from '../systems/physics/MaterialDatabase';
import { useBallStore } from '../store/ballStore';
import { useCameraStore } from '../store/cameraStore';
import { useGameStore } from '../store/gameStore';
import { useNetStore } from '../store/netStore';
import { useSettingsStore } from '../store/settingsStore';
import { useStatsStore } from '../store/statsStore';

/**
 * @module hooks/useBallSimulation
 */

function hapticImpact(force) {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
        return;
    }

    const ms = Math.min(40, Math.max(8, Math.round(force * 3)));
    try {
        navigator.vibrate(ms);
    } catch {
        // Unsupported browsers throw; ignore.
    }
}

/**
 * @param {string|null} event
 * @param {number} force
 * @param {{ soundId?: string, shake?: number, haptic?: number }|null} [effects]
 */
function feedbackForImpact(event, force, effects = null) {
    if (!event && !effects) {
        return;
    }

    const audio = getAudioManager();
    const camera = useCameraStore.getState();

    if (effects) {
        if (effects.soundId) {
            audio.play(effects.soundId);
        }
        if (effects.shake > 0) {
            camera.addShake(effects.shake);
        }
        if (effects.haptic > 0) {
            hapticImpact(effects.haptic / 3);
        }
        if (event === 'post' || event === 'crossbar' || (effects.shake ?? 0) > 0.35) {
            getAnimationManager().trigger('cameraShake');
        }

        return;
    }

    if (event === 'post' || event === 'crossbar') {
        audio.play(event === 'crossbar' ? 'crossbar' : 'post');
        camera.addShake(Math.min(0.85, 0.28 + force * 0.04));
        hapticImpact(force);
        getAnimationManager().trigger('cameraShake');
    } else if (event === 'wall' || event === 'board' || event === 'fence') {
        audio.play('post');
        camera.addShake(Math.min(0.45, 0.12 + force * 0.02));
        hapticImpact(force * 0.6);
    }
}

export function useBallSimulation() {
    const rotation = useRef({ x: 0, y: 0, z: 0 });
    const pocketTime = useRef(0);
    const resolving = useRef(false);
    const netEntry = useRef(/** @type {{ x: number, y: number, z: number }|null} */ (null));
    const lastImpactAt = useRef(0);

    useFrame((_, dt) => {
        const game = useGameStore.getState();
        const clampedDt = Math.min(dt, 0.033);

        useNetStore.getState().tick(clampedDt);

        if (game.paused || game.phase !== MATCH_PHASE.flying) {
            if (game.phase === MATCH_PHASE.aiming || game.phase === MATCH_PHASE.charging) {
                rotation.current = idleBallSpin(rotation.current, clampedDt);
                pocketTime.current = 0;
                resolving.current = false;
                netEntry.current = null;
                getBallReplayRecorder().reset();
            }

            return;
        }

        const ball = useBallStore.getState();
        if (ball.inNet) {
            pocketTime.current += clampedDt;
        }

        const { state, result, event, impact, enterNet, effects } = stepBallSimulation(
            {
                position: ball.position,
                velocity: ball.velocity,
                spin: ball.spin,
                angularVelocity: ball.angularVelocity,
                grounded: ball.grounded,
                inNet: ball.inNet,
                active: ball.active,
                deform: ball.deform ?? 0,
            },
            clampedDt,
            {
                pocketTime: pocketTime.current,
            },
        );

        useBallStore.getState().applyState(state);
        rotation.current = stepBallRotation(rotation.current, state.angularVelocity, clampedDt);

        const now = performance.now();
        if (impact && (event || effects) && now - lastImpactAt.current > 80) {
            lastImpactAt.current = now;
            feedbackForImpact(event, impact.speed ?? 0, effects ?? null);
            const material = getMaterial(impact.materialId ?? impact.surface ?? 'grass');
            useBallStore.getState().applyState({
                wear: accumulateWear(useBallStore.getState().wear ?? 0, material, impact.speed ?? 0),
            });
        }

        if (enterNet || event === 'netEnter') {
            netEntry.current = { ...state.position };
            getAnimationManager().trigger('net');
            getAudioManager().play('net');
            useNetStore.getState().registerImpact(
                state.position,
                Math.hypot(state.velocity.x, state.velocity.y, state.velocity.z),
            );
        }

        if (event === 'netHit' && impact) {
            useNetStore.getState().registerImpact(impact, impact.speed);
            getAnimationManager().trigger('net');
        }

        if (result && !resolving.current) {
            resolving.current = true;
            pocketTime.current = 0;

            const hit = netEntry.current ?? state.position;
            const zone =
                result === 'goal'
                    ? scoreGoalZone(hit, {
                          cornerBonus: useSettingsStore.getState().cornerBonusEnabled,
                      })
                    : null;

            useGameStore.getState().resolveShot(result, zone?.points ?? 0, zone);
            useGameStore.getState().enterResult();
            useStatsStore.getState().recordShot({ result, power: game.power, points: zone?.points ?? 0 });
            useCameraStore.getState().addShake(result === 'goal' ? 0.45 : 0.25);
            getAudioManager().playResult(result);
            getAnimationManager().trigger(result === 'goal' ? 'goal' : result);

            if (result === 'goal') {
                useNetStore.getState().registerImpact(state.position, 8);
            }

            netEntry.current = null;
        }
    });

    return rotation;
}
