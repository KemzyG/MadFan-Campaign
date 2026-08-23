import { Link } from '@inertiajs/react';
import Crest from '../components/Crest';
import { formatKickoff } from '../components/StadiumTicket';
import PurchaseButton from './PurchaseButton';

function statusLabel(match) {
    if (match.status === 'live') {
        return 'Live now';
    }
    if (match.status === 'finished') {
        return 'Full time';
    }
    return 'Upcoming';
}

function MetaRow({ label, value }) {
    if (!value) {
        return null;
    }
    return (
        <div className="mf-fixture-detail__meta-row">
            <span className="mf-text-caption text-[var(--mf-muted)]">{label}</span>
            <span className="mf-fixture-detail__meta-value">{value}</span>
        </div>
    );
}

/**
 * Detail pane for the selected fixture — scoreboard, match info and the
 * purchase action.
 */
export default function FixtureDetail({ match, onIssued }) {
    if (!match) {
        return (
            <div className="mf-fixture-detail mf-fixture-detail--empty">
                <p className="mf-text-meta text-[var(--mf-muted)]">
                    Select a fixture to see kickoff details and grab a ticket.
                </p>
            </div>
        );
    }

    return (
        <article className="mf-fixture-detail mf-panel-card">
            <header className={`mf-fixture-detail__board ${match.status === 'live' ? 'is-live' : ''}`}>
                <span className="mf-fixture-detail__status mf-text-caption">{statusLabel(match)}</span>
                <div className="mf-fixture-detail__sides">
                    <div className="mf-fixture-detail__side">
                        <Crest club={match.home} size="lg" />
                        <span className="mf-fixture-detail__team mf-display">{match.home?.name}</span>
                    </div>
                    <span className="mf-fixture-detail__vs mf-display" aria-hidden>
                        {match.status === 'live' ? 'LIVE' : 'VS'}
                    </span>
                    <div className="mf-fixture-detail__side">
                        <Crest club={match.away} size="lg" />
                        <span className="mf-fixture-detail__team mf-display">{match.away?.name}</span>
                    </div>
                </div>
            </header>

            <div className="mf-fixture-detail__meta">
                <MetaRow label="Competition" value={match.competition || 'Matchday'} />
                <MetaRow label="Kick-off" value={formatKickoff(match.kickoff_at, 'short')} />
                <MetaRow label="Venue" value={match.venue} />
                {match.status === 'upcoming' ? (
                    <MetaRow label="Admission" value={`GA £${match.price}`} />
                ) : null}
            </div>

            <div className="mf-fixture-detail__cta">
                <PurchaseButton match={match} onIssued={onIssued} block />
                {match.owned ? (
                    <Link href="/social/tickets/mine" className="mf-btn mf-btn--ghost mf-btn--block" prefetch>
                        View in My tickets
                    </Link>
                ) : null}
            </div>
        </article>
    );
}
