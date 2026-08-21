import { Head, Link, usePage } from '@inertiajs/react';
import SocialShell from '../../../Layouts/SocialShell';
import { StadiumTicketFace, StadiumTicketReceipt } from '../components/StadiumTicket';
import { TicketWalletSkeleton } from '../components/Skeletons';

export default function Show({ ticket }) {
    const { flash } = usePage().props;
    const freshlyIssued = Boolean(flash?.success);

    return (
        <SocialShell title="Ticket" backHref="/social/tickets/mine">
            <Head title="Stadium ticket — Mad Fan Social" />

            {ticket == null ? (
                <TicketWalletSkeleton count={1} />
            ) : (
            <div className="mf-tickets mf-tickets--show">
                {freshlyIssued ? (
                    <div className="mf-stk-issued" role="status">
                        <span className="mf-stk-issued__stamp mf-display" aria-hidden>
                            Issued
                        </span>
                        <p className="mf-stk-issued__copy">
                            Your gate pass is printed below — receipt filed in the wallet slip.
                        </p>
                    </div>
                ) : null}

                <StadiumTicketFace ticket={ticket} freshlyIssued={freshlyIssued} />

                <StadiumTicketReceipt ticket={ticket} highlight={freshlyIssued} />

                <div className="mf-gate-pass__actions">
                    <Link href="/social/tickets/mine" className="mf-btn mf-btn--ghost" prefetch>
                        Wallet
                    </Link>
                    <Link href="/social/tickets" className="mf-btn mf-btn--muted" prefetch>
                        More fixtures
                    </Link>
                    <button type="button" className="mf-btn mf-btn--pitch mf-stk-print" onClick={() => window.print()}>
                        Print / save
                    </button>
                </div>
            </div>
            )}
        </SocialShell>
    );
}
