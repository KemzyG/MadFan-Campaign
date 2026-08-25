import { Head, Link } from '@inertiajs/react';
import SocialShell from '../../../Layouts/SocialShell';

function IconFixtures() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <rect x="4" y="5" width="16" height="15" rx="2" strokeWidth="1.75" />
            <path strokeLinecap="round" strokeWidth="1.75" d="M4 9.5h16M8 3v3M16 3v3" />
        </svg>
    );
}

function IconTable() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <rect x="3.5" y="4.5" width="17" height="15" rx="1.75" strokeWidth="1.75" />
            <path strokeLinecap="round" strokeWidth="1.5" d="M3.5 9.5h17M9 9.5V19.5" />
        </svg>
    );
}

function IconChevron() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 6 6 6-6 6" />
        </svg>
    );
}

/**
 * Sport hub — the umbrella Fixtures and the League table now sit under,
 * instead of showing as separate top-level nav destinations. Today there's
 * exactly one sport (Football), so the sport row is a single highlighted
 * chip rather than a real switcher; adding a second sport later is a data
 * change here, not a rebuild.
 */
export default function SportIndex({ sports = [] }) {
    return (
        <SocialShell title="Sport">
            <Head title="Sport" />

            <div className="mf-page mf-sport-page">
                <header className="mf-sport-head">
                    <p className="mf-sport-head__kicker">Sports</p>
                    <h1 className="mf-sport-head__title">
                        {sports.find((sport) => sport.is_favourite)?.name || sports[0]?.name || 'Football'}
                    </h1>
                </header>

                {sports.length > 1 ? (
                    <div className="mf-sport-list" role="tablist" aria-label="Sports">
                        {sports.map((sport) => (
                            <span
                                key={sport.id}
                                className={`mf-sport-chip${sport.is_favourite ? ' is-active' : ''}`}
                            >
                                {sport.name}
                            </span>
                        ))}
                    </div>
                ) : null}

                <div className="mf-sport-tiles">
                    <Link href="/social/fixtures" className="mf-panel-card mf-sport-tile">
                        <span className="mf-sport-tile__icon" aria-hidden>
                            <IconFixtures />
                        </span>
                        <span className="mf-sport-tile__body">
                            <span className="mf-sport-tile__title">Fixtures</span>
                            <span className="mf-sport-tile__hint">Live, upcoming and past matches</span>
                        </span>
                        <span className="mf-sport-tile__chevron" aria-hidden>
                            <IconChevron />
                        </span>
                    </Link>

                    <Link href="/social/clubs" className="mf-panel-card mf-sport-tile">
                        <span className="mf-sport-tile__icon" aria-hidden>
                            <IconTable />
                        </span>
                        <span className="mf-sport-tile__body">
                            <span className="mf-sport-tile__title">League table</span>
                            <span className="mf-sport-tile__hint">Standings across every division</span>
                        </span>
                        <span className="mf-sport-tile__chevron" aria-hidden>
                            <IconChevron />
                        </span>
                    </Link>
                </div>
            </div>
        </SocialShell>
    );
}
