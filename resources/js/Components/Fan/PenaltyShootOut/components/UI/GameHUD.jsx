import { memo } from 'react';
import { MATCH_PHASE } from '../../constants';
import { useGameStore } from '../../store/gameStore';
import { AimIndicator } from './AimIndicator';
import { Countdown } from './Countdown';
import { MatchStatistics } from './MatchStatistics';
import { PauseMenu } from './PauseMenu';
import { PowerMeter } from './PowerMeter';
import { ResultPopup } from './ResultPopup';
import { ScoreBoard } from './ScoreBoard';
import { Settings } from './Settings';

/**
 * @module components/UI/GameHUD
 */
export const GameHUD = memo(function GameHUD({ pointsLabel = '', alreadyClaimed = false }) {
    const phase = useGameStore((s) => s.phase);

    return (
        <div className="pso-hud">
            <ScoreBoard pointsLabel={pointsLabel} />
            <AimIndicator />
            <div className="pso-hud-bottom">
                <PowerMeter />
                {(phase === MATCH_PHASE.aiming || phase === MATCH_PHASE.charging) && (
                    <div className="pso-hint">Drag aim · Hold power · Release shoot</div>
                )}
            </div>
            <ResultPopup alreadyClaimed={alreadyClaimed} />
            <PauseMenu />
            <Settings />
            <Countdown />
            <MatchStatistics />
        </div>
    );
});
