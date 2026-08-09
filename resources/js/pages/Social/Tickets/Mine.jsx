import { Head, Link } from '@inertiajs/react';
import SocialShell from '../../../Layouts/SocialShell';
import { StadiumTicketFace, statusLabel } from '../components/StadiumTicket';
import { TicketWalletSkeleton } from '../components/Skeletons';

export default function Mine({ tickets }) {
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
                        Paper-style stadium passes ready for the turnstile. Open any stub for the full gate QR.
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
                    <ul className="mf-ticket-wallet">
                        {tickets.map((ticket) => (
                            <li key={ticket.id} className="mf-ticket-wallet__item">
                                <Link
                                    href={`/social/tickets/${ticket.id}`}
                                    className="mf-ticket-wallet__link"
                                    prefetch
                                    aria-label={`${statusLabel(ticket.status)} ticket ${ticket.code}`}
                                >
                                    <StadiumTicketFace ticket={ticket} variant="wallet" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            )}
        </SocialShell>
    );
}
