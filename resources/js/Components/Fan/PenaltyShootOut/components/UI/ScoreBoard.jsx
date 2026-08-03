import { memo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useStatsStore } from '../../store/statsStore';

/**
 * @module components/UI/ScoreBoard
 */
export const ScoreBoard = memo(function ScoreBoard({ pointsLabel = '' }) {
    const score = useGameStore((s) => s.score);
    const points = useGameStore((s) => s.points);
    const round = useGameStore((s) => s.round);
    const shotsTaken = useStatsStore((s) => s.shotsTaken);

    return (
        <div className="pso-scoreboard">
            <div className="pso-score-block">
                <span>WIN</span>
                <strong>{score.player}</strong>
            </div>
            <div className="pso-score-meta">
                <div className="pso-score-points">PTS {points}</div>
                <div>ROUND {round}</div>
                <div>SHOTS {shotsTaken}</div>
                {pointsLabel ? <div className="pso-score-reward">{pointsLabel}</div> : null}
            </div>
            <div className="pso-score-block">
                <span>LOSS</span>
                <strong>{score.keeper}</strong>
            </div>
        </div>
    );
});
