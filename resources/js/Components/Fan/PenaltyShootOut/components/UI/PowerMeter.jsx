import { memo } from 'react';
import { MATCH_PHASE } from '../../constants';
import { useGameStore } from '../../store/gameStore';

/**
 * @module components/UI/PowerMeter
 */
export const PowerMeter = memo(function PowerMeter() {
    const power = useGameStore((s) => s.power);
    const charging = useGameStore((s) => s.charging);
    const phase = useGameStore((s) => s.phase);
    const pct = Math.round(power * 100);

    let tone = 'green';
    if (power > 0.75) {
        tone = 'red';
    } else if (power > 0.55) {
        tone = 'orange';
    } else if (power > 0.35) {
        tone = 'yellow';
    }

    if (phase === MATCH_PHASE.flying || phase === MATCH_PHASE.result || phase === MATCH_PHASE.replay) {
        return null;
    }

    return (
        <div className={`pso-power${charging ? ' is-charging' : ''}`}>
            <div className="pso-power-label">POWER</div>
            <div className="pso-power-track">
                <div className={`pso-power-fill tone-${tone}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="pso-power-value">{pct}%</div>
        </div>
    );
});
