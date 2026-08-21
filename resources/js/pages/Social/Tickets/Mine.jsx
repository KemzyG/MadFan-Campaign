import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import SocialShell from '../../../Layouts/SocialShell';
import { StadiumTicketFace, statusLabel } from '../components/StadiumTicket';
import { TicketWalletSkeleton } from '../components/Skeletons';
import TicketDetailModal from '../components/TicketDetailModal';

function matchesFilter(ticket, filter) {
    if (filter === 'all') {
        return true;
    }
    if (filter === 'ready') {
        return ticket.status === 'paid';
    }
    if (filter === 'used') {
        return ticket.status === 'used';
    }
    return true;
}

export default function Mine({ tickets }) {
    const [filter, setFilter] = useState('all');
    const [activeId, setActiveId] = useState(null);

    const filtered = useMemo(() => {
        if (!Array.isArray(tickets)) {
            return [];
        }

        return tickets.filter((ticket) => matchesFilter(ticket, filter));
    }, [tickets, filter]);

    const activeTicket = useMemo(
        () => (Array.isArray(tickets) ? tickets.find((ticket) => ticket.id === activeId) : null),
        [tickets, activeId],
    );

    const filters = [
        { id: 'all', label: 'All' },
        { id: 'ready', label: 'Entry ready' },
        { id: 'used', label: 'Scanned' },
    ];

    return (
        <SocialShell title="My tickets" backHref="/social/tickets">
            <Head title="My tickets — Mad Fan Social" />

            {tickets == null ? (
                <TicketWalletSkeleton />
            ) : (
                <div className="mf-tickets">
                    <div className="mf-tickets-hero mf-tickets-hero--compact">
                        <p className="mf-tickets-kicker mf-text-caption">Ticket wallet</p>
                        <p className="mf-empty-title mf-tickets-title">Your matchday stock</p>
                        <p className="mf-tickets-lead">
                            Paper-style stadium passes ready for the turnstile. Tap a stub to open the gate
                            QR in place — no page hop.
                        </p>
                        <Link href="/social/tickets" className="mf-tickets-mine-link" prefetch>
                            Browse fixtures
                        </Link>
                    </div>

                    {tickets.length === 0 ? (
                        <div className="mf-empty mf-empty--compact">
                            <p className="mf-empty-title">No tickets yet</p>
                            <p>Grab a GA pass from the fixture board.</p>
                        </div>
                    ) : (
                        <>
                            <div className="mf-ticket-filters" role="tablist" aria-label="Filter tickets">
                                {filters.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={filter === item.id}
                                        className={`mf-ticket-filter ${filter === item.id ? 'is-active' : ''}`}
                                        onClick={() => setFilter(item.id)}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            {filtered.length === 0 ? (
                                <div className="mf-empty mf-empty--compact">
                                    <p className="mf-empty-title">Nothing in this lane</p>
                                    <p>Try another status filter.</p>
                                </div>
                            ) : (
                                <ul className="mf-ticket-wallet">
                                    {filtered.map((ticket) => (
                                        <li key={ticket.id} className="mf-ticket-wallet__item">
                                            <button
                                                type="button"
                                                className="mf-ticket-wallet__link"
                                                aria-label={`${statusLabel(ticket.status)} ticket ${ticket.code}`}
                                                onClick={() => setActiveId(ticket.id)}
                                            >
                                                <StadiumTicketFace ticket={ticket} variant="wallet" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </div>
            )}

            <TicketDetailModal
                open={activeId != null}
                ticketId={activeId}
                initialTicket={activeTicket}
                onClose={() => setActiveId(null)}
            />
        </SocialShell>
    );
}
