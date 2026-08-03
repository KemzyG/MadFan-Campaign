import { memo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUiStore } from '../../store/uiStore';
import { getAudioManager } from '../../systems/audio/AudioManager';

/**
 * @module components/UI/PauseMenu
 */
export const PauseMenu = memo(function PauseMenu() {
    const paused = useGameStore((s) => s.paused);
    const showPause = useUiStore((s) => s.showPause);
    const closePause = useUiStore((s) => s.closePause);
    const openSettings = useUiStore((s) => s.openSettings);

    if (!paused && !showPause) {
        return null;
    }

    return (
        <div className="pso-pause">
            <div className="pso-pause-panel">
                <h2>PAUSED</h2>
                <button
                    type="button"
                    className="pso-result-btn"
                    onClick={() => {
                        getAudioManager().playUiClick();
                        useGameStore.getState().resumeGame();
                        closePause();
                    }}
                >
                    RESUME
                </button>
                <button
                    type="button"
                    className="pso-result-btn pso-result-btn--ghost"
                    onClick={() => {
                        getAudioManager().playUiClick();
                        openSettings();
                    }}
                >
                    SETTINGS
                </button>
            </div>
        </div>
    );
});
