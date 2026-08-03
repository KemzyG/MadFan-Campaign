import { memo } from 'react';
import { MATCH_PHASE } from '../../constants';
import { useGameStore } from '../../store/gameStore';
import { useReplayStore } from '../../store/replayStore';
import { getAudioManager } from '../../systems/audio/AudioManager';

/**
 * @module components/UI/ReplayButton
 */
export const ReplayButton = memo(function ReplayButton() {
    const phase = useGameStore((s) => s.phase);
    const active = useReplayStore((s) => s.active);

    if (phase !== MATCH_PHASE.replay || !active) {
        return null;
    }

    return (
        <button
            type="button"
            className="pso-replay-skip"
            onClick={() => {
                getAudioManager().playUiClick();
                useReplayStore.getState().stopReplay();
                useGameStore.getState().enterResult();
            }}
        >
            SKIP REPLAY
        </button>
    );
});
