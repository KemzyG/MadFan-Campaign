import { useState } from 'react';
import { socialApi } from '../../../lib/socialApi';
import { applyOptimisticProps, useSocialFlash } from '../optimistic';

/**
 * Purchase a general-admission ticket for a fixture. Patches the sectioned
 * `board` prop (live / today / coming / past) optimistically, then reconciles
 * against the server's ticket_count.
 */
function patchBoard(props, matchId, patch) {
    const patchList = (list = []) =>
        list.map((row) => (row.id === matchId ? { ...row, ...patch } : row));

    const patchComing = (days = []) =>
        days.map((day) => ({ ...day, matches: patchList(day.matches) }));

    return props.board
        ? {
              ...props.board,
              live: patchList(props.board.live),
              today: patchList(props.board.today),
              coming: patchComing(props.board.coming),
              past: patchList(props.board.past),
          }
        : props.board;
}

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
            board: patchBoard(props, match.id, { owned: true, purchasable: false, _purchasing: true }),
            ticket_count: (props.ticket_count || 0) + 1,
        }));

        try {
            const data = await socialApi(`/tickets/matches/${match.id}/purchase`, { method: 'POST' });

            applyOptimisticProps((props) => ({
                board: patchBoard(props, match.id, { owned: true, purchasable: false, _purchasing: false }),
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
            {processing || match._purchasing ? 'Purchasing…' : `£${match.price}`}
        </button>
    );
}
