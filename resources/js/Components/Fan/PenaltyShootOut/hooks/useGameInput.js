import { useEffect, useRef } from 'react';
import { AIM, MATCH_PHASE } from '../constants';
import { getAnimationManager } from '../systems/animation/AnimationManager';
import { getAudioManager } from '../systems/audio/AudioManager';
import { buildLaunch } from '../systems/ball/BallController';
import { useBallStore } from '../store/ballStore';
import { useCameraStore } from '../store/cameraStore';
import { useGameStore } from '../store/gameStore';

/**
 * @module hooks/useGameInput
 * Pointer + keyboard. Unlocks audio on first gesture.
 *
 * @param {React.RefObject<HTMLElement|null>} surfaceRef
 * @param {{ enabled?: boolean }} [options]
 */
export function useGameInput(surfaceRef, { enabled = true } = {}) {
    const mode = useRef(/** @type {'none'|'aim'|'orbit'} */ ('none'));
    const last = useRef({ x: 0, y: 0 });
    const holding = useRef(false);

    useEffect(() => {
        const el = surfaceRef.current;
        if (!el || !enabled) {
            holding.current = false;
            mode.current = 'none';

            return undefined;
        }

        const unlock = () => getAudioManager().unlock();

        const onPointerDown = (e) => {
            unlock();
            const state = useGameStore.getState();
            if (state.paused) {
                return;
            }
            if (state.phase !== MATCH_PHASE.aiming && state.phase !== MATCH_PHASE.charging) {
                return;
            }

            el.setPointerCapture(e.pointerId);
            last.current = { x: e.clientX, y: e.clientY };
            mode.current = e.button === 2 || e.altKey ? 'orbit' : 'aim';
            holding.current = true;

            if (mode.current === 'aim') {
                state.startCharge();
            }
        };

        const onPointerMove = (e) => {
            if (!holding.current) {
                return;
            }
            const dx = e.clientX - last.current.x;
            const dy = e.clientY - last.current.y;
            last.current = { x: e.clientX, y: e.clientY };

            if (mode.current === 'orbit') {
                useCameraStore.getState().setOrbitDelta(dx * 0.004, -dy * 0.003);
                return;
            }

            useGameStore.getState().setAimDelta(dx * AIM.sensitivity, -dy * AIM.sensitivity);
            useCameraStore.getState().setOrbitDelta(dx * 0.0009, -dy * 0.0005);
        };

        const releaseShot = () => {
            if (!holding.current) {
                return;
            }
            holding.current = false;
            const state = useGameStore.getState();
            if (state.phase === MATCH_PHASE.charging) {
                const { velocity, spin } = buildLaunch(state.aim, state.power);
                useBallStore.getState().launch(velocity, spin);
                state.beginFlight();
                getAudioManager().playKick();
                getAnimationManager().trigger('kick');
            }
            mode.current = 'none';
        };

        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                const g = useGameStore.getState();
                if (g.paused) {
                    g.resumeGame();
                } else {
                    g.pauseGame();
                }
            }
            if (e.key === ' ' && useGameStore.getState().phase === MATCH_PHASE.aiming) {
                e.preventDefault();
                useGameStore.getState().startCharge();
                holding.current = true;
                mode.current = 'aim';
            }
        };

        const onKeyUp = (e) => {
            if (e.key === ' ' && useGameStore.getState().phase === MATCH_PHASE.charging) {
                releaseShot();
            }
        };

        const onContextMenu = (e) => e.preventDefault();

        el.addEventListener('pointerdown', onPointerDown);
        el.addEventListener('pointermove', onPointerMove);
        el.addEventListener('pointerup', releaseShot);
        el.addEventListener('pointercancel', releaseShot);
        el.addEventListener('contextmenu', onContextMenu);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        let raf = 0;
        const tick = () => {
            useGameStore.getState().tickCharge(1 / 60);
            getAnimationManager().update(1 / 60, performance.now());
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(raf);
            el.removeEventListener('pointerdown', onPointerDown);
            el.removeEventListener('pointermove', onPointerMove);
            el.removeEventListener('pointerup', releaseShot);
            el.removeEventListener('pointercancel', releaseShot);
            el.removeEventListener('contextmenu', onContextMenu);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [surfaceRef, enabled]);
}
