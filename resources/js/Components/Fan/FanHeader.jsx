import { usePage } from '@inertiajs/react';
import FanBrandLogo from './FanBrandLogo';
import FanNav from './FanNav';

export default function FanHeader({ showStreak = false }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const streak = user?.current_streak_days ?? 0;

    return (
        <header>
            <div className="header-inner">
                <FanBrandLogo />
                <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    {user && <FanNav />}
                    {showStreak && user && (
                        <div className="streak-pill">
                            <div className="streak-fire">FIRE</div>
                            <div>
                                <div className="streak-num">{streak}</div>
                                <div className="streak-label">DAY STREAK</div>
                            </div>
                        </div>
                    )}
                    {!user && (
                        // Plain anchor: /login renders in the dark Social shell, which
                        // needs a full navigation to load its bundle/styles.
                        <a href="/login" className="pts-pill" style={{ textDecoration: 'none' }}>
                            <span
                                style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: '10px',
                                    color: 'var(--flame)',
                                    letterSpacing: '2px',
                                }}
                            >
                                ENTER CAMPAIGN
                            </span>
                        </a>
                    )}
                </div>
            </div>
        </header>
    );
}
