import { Link } from '@inertiajs/react';
import ClubCrest from './ClubCrest';

function zoneFor(position, leagueSize) {
    if (position <= 4) {
        return { label: 'Continental places', tone: 'ok' };
    }
    if (leagueSize > 3 && position >= leagueSize - 2) {
        return { label: 'Relegation zone', tone: 'bad' };
    }
    return { label: 'Mid-table', tone: 'muted' };
}

function StatBox({ label, value, hint }) {
    return (
        <div className="mf-club-stat">
            <p className="mf-club-stat__value mf-mono">{value}</p>
            <p className="mf-club-stat__label mf-text-caption">{label}</p>
            {hint ? <p className="mf-club-stat__hint mf-text-micro">{hint}</p> : null}
        </div>
    );
}

/**
 * Detail pane for the selected club — everything derivable from the standings
 * row, plus shortcuts through to that club's kits and the fixture board.
 */
export default function ClubDetailCard({ row, leagueSize, leagueName }) {
    if (!row) {
        return (
            <div className="mf-club-detail mf-club-detail--empty">
                <p className="mf-text-meta text-[var(--mf-muted)]">
                    Pick a club from the table to see their season at a glance.
                </p>
            </div>
        );
    }

    const played = row.played || 0;
    const winPct = played > 0 ? Math.round((row.won / played) * 100) : 0;
    const ppg = played > 0 ? (row.points / played).toFixed(2) : '0.00';
    const gd = row.goal_difference > 0 ? `+${row.goal_difference}` : String(row.goal_difference);
    const zone = zoneFor(row.position, leagueSize);

    return (
        <article className="mf-club-detail mf-panel-card">
            <header className="mf-club-detail__head">
                <ClubCrest club={row.club} size="lg" />
                <div className="mf-club-detail__id">
                    <p className="mf-club-detail__eyebrow mf-text-caption">
                        {leagueName || 'League'} · #{row.position} of {leagueSize}
                    </p>
                    <h2 className="mf-club-detail__name mf-display">{row.club.name}</h2>
                    <div className="mf-club-detail__tags">
                        <span className="mf-mono mf-club-detail__short">{row.club.short}</span>
                        <span className={`mf-club-detail__zone mf-club-detail__zone--${zone.tone}`}>
                            {zone.label}
                        </span>
                        {row.is_favourite ? (
                            <span className="mf-club-detail__fav">Your club</span>
                        ) : null}
                    </div>
                </div>
            </header>

            <div className="mf-club-detail__points">
                <span className="mf-club-detail__points-value mf-display">{row.points}</span>
                <span className="mf-club-detail__points-label mf-text-caption">points · {ppg} per game</span>
            </div>

            <div className="mf-club-detail__record" role="group" aria-label="Season record">
                <StatBox label="Played" value={played} />
                <StatBox label="Won" value={row.won} />
                <StatBox label="Drawn" value={row.drawn} />
                <StatBox label="Lost" value={row.lost} />
            </div>

            <div className="mf-club-detail__goals" role="group" aria-label="Goals">
                <StatBox label="For" value={row.goals_for} />
                <StatBox label="Against" value={row.goals_against} />
                <StatBox label="Diff" value={gd} />
                <StatBox label="Win rate" value={`${winPct}%`} />
            </div>

            <div className="mf-club-detail__actions">
                <Link
                    href={`/social/shop?club_id=${row.club.id}`}
                    className="mf-btn mf-btn--pitch"
                    prefetch
                >
                    Shop kits
                </Link>
                <Link href="/social/fixtures" className="mf-btn mf-btn--ghost" prefetch>
                    Fixtures
                </Link>
            </div>
        </article>
    );
}
