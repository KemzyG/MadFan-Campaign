import { useState } from 'react';
import { socialApi } from '../../../lib/socialApi';
import { applyOptimisticProps, useSocialFlash } from '../optimistic';

/**
 * Purchase a general-admission ticket from the box office. Patches the flat
 * `matches` prop optimistically, then reconciles against the server's
 * ticket_count.
 */
export default function PurchaseButton({ match, onIssued, block = false }) {
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
            const data = await socialApi(`/tickets/matches/${match.id}/purchase`, { method: 'POST' });

            applyOptimisticProps((props) => ({
                matches: (props.matches || []).map((row) =>
                    row.id === match.id
                        ? { ...row, owned: true, purchasable: false, _purchasing: false }
                        : row,
                ),
                ticket_count:
                    typeof data.ticket_count === 'number' ? data.ticket_count : props.ticket_count,
            }));

            reportSuccess?.(data.message || 'Ticket issued.');
            if (data.ticket) {
                onIssued?.(data.ticket);
            }
        } catch (error) {
            rollback();
            reportError?.(error instanceof Error ? error.message : 'Purchase failed — rolled back.');
        } finally {
            setProcessing(false);
        }
    }

    return (
        <button
            type="button"
            className={['mf-btn', 'mf-btn--pitch', block ? 'mf-btn--block' : ''].filter(Boolean).join(' ')}
            disabled={processing}
            onClick={purchase}
        >
            {processing || match._purchasing ? 'Purchasing…' : `Confirm £${match.price}`}
        </button>
    );
}
