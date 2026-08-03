import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect } from 'react';
import { Scene } from './components/Scene/SceneRoot';
import { FullscreenToggle } from './components/UI/FullscreenToggle';
import { GameHUD } from './components/UI/GameHUD';
import { useGameInput } from './hooks/useGameInput';
import { useMatchLifecycle } from './hooks/useMatchLifecycle';
import { useShootoutFullscreen } from './hooks/useShootoutFullscreen';
import { useSettingsStore } from './store/settingsStore';
import './styles/penalty-shootout.css';

/**
 * Professional 3D penalty shootout — production architecture entry.
 *
 * @param {{
 *   disabled?: boolean,
 *   scored?: boolean,
 *   onScore?: () => void,
 *   onWinPoints?: (payload: { points: number, zone: object|null }) => void,
 *   onLoss?: (payload: { result: string }) => void,
 *   pointsLabel?: string,
 *   freePlay?: boolean,
 *   cooldownSeconds?: number,
 *   cornerBonusEnabled?: boolean,
 *   initialWins?: number,
 *   initialLosses?: number,
 * }} props
 *
 * @see docs/ARCHITECTURE.md
 */
export default function PenaltyShootOut({
    disabled = false,
    scored = false,
    onScore,
    onWinPoints,
    onLoss,
    pointsLabel = '',
    freePlay = true,
    cooldownSeconds = 0,
    cornerBonusEnabled = false,
    initialWins = 0,
    initialLosses = 0,
}) {
    const { isFullscreen, toggleFullscreen, surfaceRef } = useShootoutFullscreen();
    const quality = useSettingsStore((s) => s.quality);
    const dpr = useSettingsStore((s) => s.dpr);
    const coolingDown = cooldownSeconds > 0;
    const lockPlay = coolingDown || disabled || !freePlay;

    useEffect(() => {
        useSettingsStore.getState().setCornerBonusEnabled(cornerBonusEnabled);
    }, [cornerBonusEnabled]);

    useGameInput(surfaceRef, { enabled: !lockPlay });
    useMatchLifecycle({
        scored,
        disabled: lockPlay,
        onScore,
        onWinPoints,
        onLoss,
        freePlay: !lockPlay,
        initialWins,
        initialLosses,
    });

    const hours = Math.floor(cooldownSeconds / 3600);
    const minutes = Math.floor((cooldownSeconds % 3600) / 60);
    const seconds = cooldownSeconds % 60;

    return (
        <>
            {isFullscreen ? <div className="pso-fullscreen-spacer" aria-hidden="true" /> : null}
            <div
                className={[
                    'penalty-shot',
                    'penalty-shot-3d',
                    'pso-root',
                    lockPlay ? 'is-disabled' : '',
                    coolingDown ? 'is-cooling' : '',
                    isFullscreen ? 'is-fullscreen' : '',
                ]
                    .filter(Boolean)
                    .join(' ')}
                ref={surfaceRef}
                aria-disabled={lockPlay}
            >
                <FullscreenToggle active={isFullscreen} onToggle={toggleFullscreen} />
                <Canvas
                    shadows={quality === 'high'}
                    dpr={dpr}
                    camera={{ position: [0, 2.2, 15.2], fov: 40, near: 0.1, far: 120 }}
                    gl={{
                        antialias: quality === 'high',
                        powerPreference: quality === 'low' ? 'low-power' : 'high-performance',
                        stencil: false,
                        depth: true,
                    }}
                    performance={{ min: 0.5 }}
                    style={{ pointerEvents: lockPlay ? 'none' : 'auto' }}
                >
                    <Suspense fallback={null}>
                        <Scene />
                    </Suspense>
                </Canvas>
                <GameHUD pointsLabel={pointsLabel} alreadyClaimed={Boolean(scored)} />
                {coolingDown ? (
                    <div className="pso-cooldown-overlay" role="status" aria-live="polite">
                        <div className="pso-cooldown-overlay__label">Cooldown</div>
                        <div className="pso-cooldown-overlay__digits">
                            <span>{String(hours).padStart(2, '0')}</span>
                            <em>:</em>
                            <span>{String(minutes).padStart(2, '0')}</span>
                            <em>:</em>
                            <span>{String(seconds).padStart(2, '0')}</span>
                        </div>
                        <div className="pso-cooldown-overlay__hint">Shootout locked. Come back when the timer ends</div>
                    </div>
                ) : null}
            </div>
        </>
    );
}
