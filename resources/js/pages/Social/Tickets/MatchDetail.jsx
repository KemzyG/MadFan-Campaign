import { Link } from '@inertiajs/react';
import Crest from '../components/Crest';
import { formatKickoff } from '../components/StadiumTicket';
import PurchaseButton from './PurchaseButton';

function MetaRow({ label, value }) {
    if (!value) {
        return null;
    }
    return (
        <div className="mf-ticket-detail__meta-row">
            <span className="mf-text-caption text-[var(--mf-muted)]">{label}</span>
            <span className="mf-ticket-detail__meta-value">{value}</span>
        </div>
    );
}

/**
 * Checkout / detail pane for the selected fixture in the box office. Shows the
 * matchup, admission info and the confirm-purchase action.
 */
export default function MatchDetail({ match, onIssued }) {
    if (!match) {
        return (
            <div className="mf-ticket-detail mf-ticket-detail--empty">
                <p className="mf-text-meta text-[var(--mf-muted)]">
                    Pick a fixture to review admission and confirm your general-admission pass.
                </p>
            </div>
        );
    }

    return (
        <article className="mf-ticket-detail mf-panel-card">
            <header className="mf-ticket-detail__board">
                <span className="mf-ticket-detail__eyebrow mf-text-caption">Box office</span>
                <div className="mf-ticket-detail__sides">
                    <div className="mf-ticket-detail__side">
                        <Crest club={match.home} size="lg" />
                        <span className="mf-ticket-detail__team mf-display">{match.home?.name}</span>
                    </div>
                    <span className="mf-ticket-detail__vs mf-display" aria-hidden>VS</span>
                    <div className="mf-ticket-detail__side">
                        <Crest club={match.away} size="lg" />
                        <span className="mf-ticket-detail__team mf-display">{match.away?.name}</span>
                    </div>
                </div>
            </header>

            <div className="mf-ticket-detail__meta">
                <MetaRow label="Competition" value={match.competition || 'Matchday'} />
                <MetaRow label="Kick-off" value={formatKickoff(match.kickoff_at, 'short')} />
                <MetaRow label="Venue" value={match.venue} />
                <MetaRow label="Admission" value={`General admission · £${match.price}`} />
            </div>

            <div className="mf-ticket-detail__cta">
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
