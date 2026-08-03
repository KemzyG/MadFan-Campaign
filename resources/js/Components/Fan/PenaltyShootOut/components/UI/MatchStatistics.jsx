import { memo } from 'react';
import { useStatsStore } from '../../store/statsStore';
import { useUiStore } from '../../store/uiStore';

/**
 * @module components/UI/MatchStatistics
 */
export const MatchStatistics = memo(function MatchStatistics() {
    const show = useUiStore((s) => s.showStats);
    const stats = useStatsStore();

    if (!show) {
        return null;
    }

    return (
        <div className="pso-stats">
            <div>Goals {stats.goals}</div>
            <div>Saves {stats.saves}</div>
            <div>Posts {stats.posts}</div>
            <div>Misses {stats.misses}</div>
            <div>Avg power {(stats.avgPower * 100).toFixed(0)}%</div>
        </div>
    );
});
