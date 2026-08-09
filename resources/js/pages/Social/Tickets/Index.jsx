import { Head, Link, useForm } from '@inertiajs/react';
import SocialShell from '../../../Layouts/SocialShell';
import { formatKickoff } from '../components/StadiumTicket';
import { TicketListSkeleton } from '../components/Skeletons';
import { useSocialFlash, withRollbackFlash } from '../optimistic';

function ClubCrest({ club }) {
    if (club?.logo_url) {
        return <img src={club.logo_url} alt="" className="mf-ticket-crest__img" />;
    }

    return (
        <span className="mf-ticket-crest__mark mf-display" aria-hidden>
            {(club?.short || club?.name || '?').slice(0, 3)}
        </span>
    );
}

function PurchaseButton({ match }) {
    const { post, processing, optimistic } = useForm({});
    const { reportError } = useSocialFlash();

    if (match.owned) {
        return <span className="mf-ticket-chip mf-ticket-chip--owned mf-mono">Owned</span>;
    }

    if (!match.purchasable) {
        return <span className="mf-ticket-chip mf-mono">Unavailable</span>;
    }

    return (
        <button
            type="button"
            className="mf-btn mf-btn--pitch mf-ticket-buy"
            disabled={processing}
            onClick={() =>
                optimistic((props) => ({
                    matches: (props.matches || []).map((row) =>
                        row.id === match.id
                            ? { ...row, owned: true, purchasable: false, _purchasing: true }
                            : row,
                    ),
                    ticket_count: (props.ticket_count || 0) + 1,
                })).post(
                    `/social/tickets/matches/${match.id}/purchase`,
                    withRollbackFlash(reportError, {}, 'Purchase failed — rolled back.'),
                )
            }
        >
            {processing || match._purchasing ? 'Purchasing…' : `Confirm £${match.price}`}
        </button>
    );
}

function MatchRow({ match }) {
    return (
        <article className="mf-ticket-match">
            <div className="mf-ticket-match__perf" aria-hidden />
            <div className="mf-ticket-match__league mf-text-caption text-[var(--mf-muted)]">
                <span>{match.competition || 'Matchday'}</span>
                <span className="mf-mono">{formatKickoff(match.kickoff_at, 'short')}</span>
            </div>

            <div className="mf-ticket-match__sides">
                <div className="mf-ticket-side">
                    <span className="mf-ticket-crest">
                        <ClubCrest club={match.home} />
                    </span>
                    <span className="mf-ticket-side__name">{match.home?.name}</span>
                </div>
                <span className="mf-ticket-vs mf-display" aria-hidden>
                    VS
                </span>
                <div className="mf-ticket-side mf-ticket-side--away">
                    <span className="mf-ticket-crest">
                        <ClubCrest club={match.away} />
                    </span>
                    <span className="mf-ticket-side__name">{match.away?.name}</span>
                </div>
            </div>

            <div className="mf-ticket-match__meta">
                <p className="mf-text-meta text-[var(--mf-muted)]">
                    <span className="mf-ticket-venue">{match.venue}</span>
                    <span className="mf-ticket-dot" aria-hidden>
                        ·
                    </span>
                    <span className="mf-mono">GA £{match.price}</span>
                </p>
                <PurchaseButton match={match} />
            </div>
        </article>
    );
}

export default function Index({ matches, ticket_count = 0 }) {
    return (
        <SocialShell title="Tickets">
            <Head title="Match tickets — Mad Fan Social" />

            {matches == null ? (
                <TicketListSkeleton />
            ) : (
            <div className="mf-tickets">
                <div className="mf-tickets-hero">
                    <p className="mf-tickets-kicker mf-text-caption">Box office</p>
                    <p className="mf-empty-title mf-tickets-title">Upcoming fixtures</p>
                    <p className="mf-tickets-lead">
                        Confirm purchase to print a GA stadium ticket to your wallet — monochrome stock face,
                        perforated stub, turnstile QR. No card rails on this pass.
                    </p>
                    <Link href="/social/tickets/mine" className="mf-tickets-mine-link" prefetch>
                        My tickets
                        {ticket_count > 0 ? (
                            <span className="mf-mono mf-tickets-count">{ticket_count}</span>
                        ) : null}
                    </Link>
                </div>

                {matches.length === 0 ? (
                    <div className="mf-empty mf-empty--compact">
                        <p className="mf-empty-title">Fixture board empty</p>
                        <p>Upcoming matches will land here when seeded.</p>
                    </div>
                ) : (
                    <div className="mf-ticket-list">
                        {matches.map((match) => (
                            <MatchRow key={match.id} match={match} />
                        ))}
                    </div>
                )}
            </div>
            )}
        </SocialShell>
    );
}
