import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import { socialApi } from '../../../lib/socialApi';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';
import { formatKickoff } from '../components/StadiumTicket';
import { TicketListSkeleton } from '../components/Skeletons';
import TicketDetailModal from '../components/TicketDetailModal';
import { applyOptimisticProps, useSocialFlash } from '../optimistic';

function ClubCrest({ club }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });

    if (club?.logo_url) {
        return (
            <img
                src={club.logo_url}
                alt=""
                className="mf-ticket-crest__img"
                onError={(event) => onImageError(event, fallbackUrl)}
            />
        );
    }

    return (
        <span className="mf-ticket-crest__mark mf-display" aria-hidden>
            {(club?.short || club?.name || '?').slice(0, 3)}
        </span>
    );
}

function PurchaseButton({ match, onIssued }) {
    const { reportError, reportSuccess } = useSocialFlash();
    const [processing, setProcessing] = useState(false);

    if (match.owned) {
        return <span className="mf-ticket-chip mf-ticket-chip--owned mf-mono">Owned</span>;
    }

    if (!match.purchasable) {
        return <span className="mf-ticket-chip mf-mono">Unavailable</span>;
    }

    async function purchase() {
        if (processing) {
            return;
        }

        setProcessing(true);
        const rollback = applyOptimisticProps((props) => ({
            matches: (props.matches || []).map((row) =>
                row.id === match.id
                    ? { ...row, owned: true, purchasable: false, _purchasing: true }
                    : row,
            ),
            ticket_count: (props.ticket_count || 0) + 1,
        }));

        try {
            const data = await socialApi(`/tickets/matches/${match.id}/purchase`, {
                method: 'POST',
            });

            applyOptimisticProps((props) => ({
                matches: (props.matches || []).map((row) =>
                    row.id === match.id
                        ? { ...row, owned: true, purchasable: false, _purchasing: false }
                        : row,
                ),
                ticket_count:
                    typeof data.ticket_count === 'number'
                        ? data.ticket_count
                        : props.ticket_count,
            }));

            reportSuccess?.(data.message || 'Ticket issued.');
            if (data.ticket) {
                onIssued?.(data.ticket);
            }
        } catch (error) {
            rollback();
            reportError?.(
                error instanceof Error ? error.message : 'Purchase failed — rolled back.',
            );
        } finally {
            setProcessing(false);
        }
    }

    return (
        <button
            type="button"
            className="mf-btn mf-btn--pitch mf-ticket-buy"
            disabled={processing}
            onClick={purchase}
        >
            {processing || match._purchasing ? 'Purchasing…' : `Confirm £${match.price}`}
        </button>
    );
}

function MatchRow({ match, onIssued }) {
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
                <PurchaseButton match={match} onIssued={onIssued} />
            </div>
        </article>
    );
}

export default function Index({ matches, ticket_count = 0 }) {
    const [issuedTicket, setIssuedTicket] = useState(null);

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
                        <div className="mf-fixtures-hero__links">
                            <Link href="/social/fixtures" className="mf-tickets-mine-link" prefetch>
                                Full fixture board
                            </Link>
                            <Link href="/social/tickets/mine" className="mf-tickets-mine-link" prefetch>
                                My tickets
                                {ticket_count > 0 ? (
                                    <span className="mf-mono mf-tickets-count">{ticket_count}</span>
                                ) : null}
                            </Link>
                        </div>
                    </div>

                    {matches.length === 0 ? (
                        <div className="mf-empty mf-empty--compact">
                            <p className="mf-empty-title">Fixture board empty</p>
                            <p>Upcoming matches will land here when seeded.</p>
                        </div>
                    ) : (
                        <div className="mf-ticket-list">
                            {matches.map((match) => (
                                <MatchRow key={match.id} match={match} onIssued={setIssuedTicket} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            <TicketDetailModal
                open={issuedTicket != null}
                ticketId={issuedTicket?.id}
                initialTicket={issuedTicket}
                onClose={() => setIssuedTicket(null)}
            />
        </SocialShell>
    );
}
