import { memo } from 'react';
import { AIM, GOAL, MATCH_PHASE } from '../../constants';
import { useGameStore } from '../../store/gameStore';

/**
 * @module components/UI/AimIndicator
 * Aim pad — scoring zones live on the 3D goal face, not here.
 */
export const AimIndicator = memo(function AimIndicator() {
    const aim = useGameStore((s) => s.aim);
    const phase = useGameStore((s) => s.phase);

    if (phase !== MATCH_PHASE.aiming && phase !== MATCH_PHASE.charging) {
        return null;
    }

    const left = 50 + (aim.x / AIM.maxX) * 48;
    const top = 100 - ((aim.y - AIM.minY) / (AIM.maxY - AIM.minY)) * 92;

    const goalLeft = 50 - (GOAL.width / 2 / AIM.maxX) * 48;
    const goalRight = 50 + (GOAL.width / 2 / AIM.maxX) * 48;
    const goalTop = 100 - ((GOAL.height - AIM.minY) / (AIM.maxY - AIM.minY)) * 92;
    const goalBottom = 100 - ((0.2 - AIM.minY) / (AIM.maxY - AIM.minY)) * 92;
    const goalWidth = goalRight - goalLeft;
    const goalHeight = goalBottom - goalTop;

    const outside =
        Math.abs(aim.x) > GOAL.width / 2 - 0.15 || aim.y > GOAL.height - 0.1;

    return (
        <div className="pso-aim" aria-hidden="true">
            <div className="pso-aim-goal">
                <div
                    className="pso-aim-mouth"
                    style={{
                        left: `${goalLeft}%`,
                        top: `${goalTop}%`,
                        width: `${goalWidth}%`,
                        height: `${Math.max(8, goalHeight)}%`,
                    }}
                />
                <div
                    className={`pso-aim-dot${outside ? ' is-wide' : ''}`}
                    style={{ left: `${left}%`, top: `${top}%` }}
                />
                <svg className="pso-aim-curve" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path
                        d={`M 50 95 Q ${50 + aim.x * 4} ${75 - aim.y * 6} ${left} ${top}`}
                        fill="none"
                        stroke={outside ? 'rgba(255,77,0,0.7)' : 'rgba(232,255,0,0.55)'}
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                    />
                </svg>
            </div>
        </div>
    );
});
