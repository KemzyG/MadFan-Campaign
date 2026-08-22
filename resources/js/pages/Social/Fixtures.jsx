import { Head, Link, router, usePage, usePoll } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import SocialShell from '../../Layouts/SocialShell';
import { onImageError, resolveDefaultImageUrl } from '../../lib/defaultImage';
import { socialApi } from '../../lib/socialApi';
import { formatKickoff } from './components/StadiumTicket';
import { TicketListSkeleton } from './components/Skeletons';
import TicketDetailModal from './components/TicketDetailModal';
import { applyOptimisticProps, useSocialFlash } from './optimistic';

const TABS = [
    { id: 'all', label: 'All' },
    { id: 'live', label: 'Live' },
    { id: 'today', label: 'Today' },
    { id: 'coming', label: 'Coming' },
    { id: 'past', label: 'Past' },
];

function ClubCrest({ club }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });

    if (club?.logo_url) {
        return (
            <img
                src={club.logo_url}
                alt=""
                className="mf-fixture-crest__img"
                onError={(event) => onImageError(event, fallbackUrl)}
            />
        );
    }

    return (
        <span className="mf-fixture-crest__mark mf-display" aria-hidden>
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
        return null;
    }

    async function purchase() {
        if (processing) {
            return;
        }

        setProcessing(true);
        const rollback = applyOptimisticProps((props) => {
            const patchList = (list = []) =>
                list.map((row) =>
                    row.id === match.id
                        ? { ...row, owned: true, purchasable: false, _purchasing: true }
                        : row);

            const patchComing = (days = []) =>
                days.map((day) => ({
                    ...day,
                    matches: patchList(day.matches),
                }));

            return {
                board: props.board
                    ? {
                        ...props.board,
                        live: patchList(props.board.live),
                        today: patchList(props.board.today),
                        coming: patchComing(props.board.coming),
                        past: patchList(props.board.past),
                    }
                    : props.board,
                ticket_count: (props.ticket_count || 0) + 1,
            };
        });

        try {
            const data = await socialApi(`/tickets/matches/${match.id}/purchase`, {
                method: 'POST',
            });

            applyOptimisticProps((props) => {
                const patchList = (list = []) =>
                    list.map((row) =>
                        row.id === match.id
                            ? { ...row, owned: true, purchasable: false, _purchasing: false }
                            : row);

                const patchComing = (days = []) =>
                    days.map((day) => ({
                        ...day,
                        matches: patchList(day.matches),
                    }));

                return {
                    board: props.board
                        ? {
                            ...props.board,
                            live: patchList(props.board.live),
                            today: patchList(props.board.today),
                            coming: patchComing(props.board.coming),
                            past: patchList(props.board.past),
                        }
                        : props.board,
                    ticket_count:
                        typeof data.ticket_count === 'number'
                            ? data.ticket_count
                            : props.ticket_count,
                };
            });

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
            className="mf-btn mf-btn--pitch mf-fixture-buy"
            disabled={processing}
            onClick={purchase}
        >
            {processing || match._purchasing ? 'Purchasing…' : `£${match.price}`}
        </button>
    );
}

function statusBadge(match) {
    if (match.status === 'live') {
        return <span className="mf-fixture-badge mf-fixture-badge--live">Live</span>;
    }
    if (match.status === 'finished') {
        return <span className="mf-fixture-badge">FT</span>;
    }
    return (
        <span className="mf-fixture-badge mf-fixture-badge--kick mf-mono">
            {formatKickoff(match.kickoff_at, 'short')}
        </span>
    );
}

function FixtureCard({ match, onIssued }) {
    return (
        <article className={`mf-fixture-card ${match.status === 'live' ? 'is-live' : ''}`}>
            <div className="mf-fixture-card__top">
                <span className="mf-text-caption text-[var(--mf-muted)]">
                    {match.competition || 'Matchday'}
                </span>
                {statusBadge(match)}
            </div>

            <div className="mf-fixture-card__sides">
                <div className="mf-fixture-side">
                    <span className="mf-fixture-crest">
                        <ClubCrest club={match.home} />
                    </span>
                    <span className="mf-fixture-side__name">{match.home?.name}</span>
                </div>
                <span className="mf-fixture-vs mf-display" aria-hidden>
                    {match.status === 'live' ? 'LIVE' : 'VS'}
                </span>
                <div className="mf-fixture-side mf-fixture-side--away">
                    <span className="mf-fixture-crest">
                        <ClubCrest club={match.away} />
                    </span>
                    <span className="mf-fixture-side__name">{match.away?.name}</span>
                </div>
            </div>

            <div className="mf-fixture-card__meta">
                <p className="mf-text-meta text-[var(--mf-muted)]">
                    <span>{match.venue}</span>
                    {match.status === 'upcoming' ? (
                        <>
                            <span className="mf-fixture-dot" aria-hidden>·</span>
                            <span className="mf-mono">GA £{match.price}</span>
                        </>
                    ) : null}
                </p>
                <div className="mf-fixture-card__actions">
                    <PurchaseButton match={match} onIssued={onIssued} />
                    {match.owned ? (
                        <Link href="/social/tickets/mine" className="mf-text-meta text-[var(--mf-pitch)]" prefetch>
                            Wallet
                        </Link>
                    ) : null}
                </div>
            </div>
        </article>
    );
}

function Section({ id, title, count, children, empty }) {
    return (
        <section className="mf-fixture-section" id={`fixtures-${id}`} aria-labelledby={`fixtures-${id}-title`}>
            <header className="mf-fixture-section__head">
                <h2 id={`fixtures-${id}-title`} className="mf-fixture-section__title">
                    {title}
                </h2>
                <span className="mf-mono mf-text-micro text-[var(--mf-muted)]">{count}</span>
            </header>
            {count === 0 ? (
                <p className="mf-fixture-empty mf-text-meta text-[var(--mf-muted)]">{empty}</p>
            ) : (
                children
            )}
        </section>
    );
}

export default function Fixtures({
    tab = 'all',
    board,
    ticket_count = 0,
    poll_ms = 15000,
}) {
    const [issuedTicket, setIssuedTicket] = useState(null);
    const counts = board?.counts || { live: 0, today: 0, coming: 0, past: 0 };
    const comingCount = useMemo(
        () => (board?.coming || []).reduce((sum, day) => sum + (day.matches?.length || 0), 0),
        [board?.coming],
    );

    usePoll(poll_ms, {
        only: ['board'],
        preserveScroll: true,
    });

    function setTab(next) {
        router.get('/social/fixtures', { tab: next === 'all' ? undefined : next }, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    }

    const showLive = tab === 'all' || tab === 'live';
    const showToday = tab === 'all' || tab === 'today';
    const showComing = tab === 'all' || tab === 'coming';
    const showPast = tab === 'all' || tab === 'past';

    return (
        <SocialShell title="Fixtures">
            <Head title="Fixtures — Mad Fan Social" />

            {board == null ? (
                <TicketListSkeleton />
            ) : (
                <div className="mf-fixtures">
                    <header className="mf-fixtures-hero">
                        <p className="mf-tickets-kicker mf-text-caption">Match centre</p>
                        <p className="mf-empty-title mf-tickets-title">Fixtures</p>
                        <div className="mf-fixtures-hero__links">
                            <Link href="/social/clubs" className="mf-tickets-mine-link" prefetch>
                                League table
                            </Link>
                            <Link href="/social/tickets" className="mf-tickets-mine-link" prefetch>
                                Box office
                            </Link>
                            <Link href="/social/tickets/mine" className="mf-tickets-mine-link" prefetch>
                                My tickets
                                {ticket_count > 0 ? (
                                    <span className="mf-mono mf-tickets-count">{ticket_count}</span>
                                ) : null}
                            </Link>
                        </div>
                    </header>

                    <div className="mf-fixtures-tabs" role="tablist" aria-label="Fixture filters">
                        {TABS.map((item) => {
                            const count =
                                item.id === 'all'
                                    ? counts.live + counts.today + comingCount + counts.past
                                    : item.id === 'coming'
                                        ? comingCount
                                        : counts[item.id] || 0;

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={tab === item.id}
                                    className={tab === item.id ? 'is-active' : ''}
                                    onClick={() => setTab(item.id)}
                                >
                                    {item.label}
                                    <span className="mf-mono">{count}</span>
                                </button>
                            );
                        })}
                    </div>

                    {showLive ? (
                        <Section
                            id="live"
                            title="Live"
                            count={counts.live}
                            empty="No matches live right now."
                        >
                            <div className="mf-fixture-list">
                                {(board.live || []).map((match) => (
                                    <FixtureCard key={match.id} match={match} onIssued={setIssuedTicket} />
                                ))}
                            </div>
                        </Section>
                    ) : null}

                    {showToday ? (
                        <Section
                            id="today"
                            title="Today"
                            count={counts.today}
                            empty="No more kickoffs today."
                        >
                            <div className="mf-fixture-list">
                                {(board.today || []).map((match) => (
                                    <FixtureCard key={match.id} match={match} onIssued={setIssuedTicket} />
                                ))}
                            </div>
                        </Section>
                    ) : null}

                    {showComing ? (
                        <Section
                            id="coming"
                            title="Coming days"
                            count={comingCount}
                            empty="No upcoming fixtures on the board."
                        >
                            <div className="mf-fixture-days">
                                {(board.coming || []).map((day) => (
                                    <div key={day.date} className="mf-fixture-day">
                                        <h3 className="mf-fixture-day__label">{day.label}</h3>
                                        <div className="mf-fixture-list">
                                            {(day.matches || []).map((match) => (
                                                <FixtureCard
                                                    key={match.id}
                                                    match={match}
                                                    onIssued={setIssuedTicket}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    ) : null}

                    {showPast ? (
                        <Section
                            id="past"
                            title="Past"
                            count={counts.past}
                            empty="No finished matches yet."
                        >
                            <div className="mf-fixture-list">
                                {(board.past || []).map((match) => (
                                    <FixtureCard key={match.id} match={match} onIssued={setIssuedTicket} />
                                ))}
                            </div>
                        </Section>
                    ) : null}
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
