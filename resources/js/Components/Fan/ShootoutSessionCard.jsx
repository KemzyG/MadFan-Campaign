import { memo } from 'react';

/**
 * @param {{
 *   shootout?: {
 *     active?: boolean,
 *     window_earned?: number,
 *     window_limit?: number,
 *     cooldown_until?: string|null,
 *     cooldown_seconds?: number,
 *     earned_today?: number,
 *     wins_today?: number,
 *     losses_today?: number,
 *   }
 * }} props
 */
export default memo(function ShootoutSessionCard({ shootout = {} }) {
    const wins = shootout.wins_today ?? 0;
    const losses = shootout.losses_today ?? 0;
    const earnedToday = shootout.earned_today ?? 0;

    const windowLimit = shootout.window_limit ?? 15;
    const windowEarned = shootout.window_earned ?? 0;
    const coolingDown = (shootout.cooldown_seconds ?? 0) > 0;
    const progress = Math.min(100, Math.round((windowEarned / Math.max(1, windowLimit)) * 100));

    return (
        <section
            className={`shootout-session-card${coolingDown ? ' is-cooling' : ''}`}
            aria-label="Shootout session stats"
        >
            <div className="shootout-session-card__glow" aria-hidden="true" />

            <div className="shootout-session-card__earn">
                <div className="shootout-session-card__subtitle">Total earning today</div>
                <div className="shootout-session-card__balance">
                    <span className="shootout-session-card__sign">+</span>
                    {earnedToday}
                </div>
                <div className="shootout-session-card__window">
                    Shots {windowEarned}/{windowLimit}
                    <span className="shootout-session-card__window-bar" aria-hidden="true">
                        <span style={{ width: `${progress}%` }} />
                    </span>
                </div>
            </div>

            <div className="shootout-session-card__footer">
                <div className="shootout-session-foot shootout-session-foot--win" aria-label={`${wins} wins today`}>
                    <span className="shootout-session-foot__label">Wins today</span>
                    <span className="shootout-session-foot__value">{wins}</span>
                </div>
                <div className="shootout-session-foot shootout-session-foot--loss" aria-label={`${losses} losses today`}>
                    <span className="shootout-session-foot__label">Lost today</span>
                    <span className="shootout-session-foot__value">{losses}</span>
                </div>
            </div>
        </section>
    );
});
