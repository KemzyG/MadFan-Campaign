import { memo } from 'react';
import { MATCH_PHASE } from '../../constants';
import { useGameStore } from '../../store/gameStore';

const LABELS = {
    goal: 'GOAL!',
    miss: 'MISS',
    post: 'MISS',
    crossbar: 'MISS',
    save: 'MISS',
};

/**
 * @module components/UI/ResultPopup
 * Flash-only result — auto-resets; no retry / next buttons.
 */
export const ResultPopup = memo(function ResultPopup({ alreadyClaimed = false }) {
    const result = useGameStore((s) => s.lastResult);
    const lastPoints = useGameStore((s) => s.lastPoints);
    const phase = useGameStore((s) => s.phase);
    const claimed = useGameStore((s) => s.claimed);

    if (phase !== MATCH_PHASE.result || !result) {
        return null;
    }

    const isGoal = result === 'goal';

    return (
        <div className={`pso-result pso-result--flash${isGoal ? ' is-goal' : ''}`}>
            <div className="pso-result-title">{LABELS[result] ?? 'MISS'}</div>
            {isGoal && lastPoints > 0 ? (
                <div className="pso-result-points">+{lastPoints} PTS</div>
            ) : null}
            {isGoal && (alreadyClaimed || claimed) ? (
                <div className="pso-result-sub">Reward claimed</div>
            ) : null}
        </div>
    );
});
