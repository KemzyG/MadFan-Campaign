import { useEffect, useId, useRef, useState } from 'react';
import PassportQrCode from '../../../Components/Fan/PassportQrCode';
import { socialApi } from '../../../lib/socialApi';
import { StadiumTicketFace, StadiumTicketReceipt, statusLabel } from './StadiumTicket';
import { useSocialFlash } from '../optimistic';

/**
 * Ticket detail modal — gate pass + receipt without leaving the wallet.
 */
export default function TicketDetailModal({ ticketId, initialTicket = null, open, onClose }) {
    const titleId = useId();
    const closeRef = useRef(null);
    const { reportError, reportSuccess } = useSocialFlash();
    const [ticket, setTicket] = useState(initialTicket);
    const [loading, setLoading] = useState(false);
    const [qrExpanded, setQrExpanded] = useState(false);

    useEffect(() => {
        if (!open) {
            setQrExpanded(false);
            return undefined;
        }

        closeRef.current?.focus();

        function onKey(event) {
            if (event.key === 'Escape') {
                onClose?.();
            }
        }

        document.addEventListener('keydown', onKey);
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = previous;
        };
    }, [open, onClose]);

    useEffect(() => {
        if (!open || !ticketId) {
            return undefined;
        }

        let cancelled = false;

        if (initialTicket?.qr_payload && initialTicket.id === ticketId) {
            setTicket(initialTicket);
        }

        setLoading(true);
        socialApi(`/tickets/${ticketId}`)
            .then((data) => {
                if (!cancelled) {
                    setTicket(data.ticket);
                }
            })
            .catch((error) => {
                if (!cancelled) {
                    reportError?.(
                        error instanceof Error ? error.message : 'Could not load ticket.',
                    );
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [open, ticketId, initialTicket, reportError]);

    if (!open) {
        return null;
    }

    async function copyCode() {
        const code = ticket?.code;
        if (!code) {
            return;
        }

        try {
            await navigator.clipboard.writeText(code);
            reportSuccess?.('Ticket code copied.');
        } catch {
            reportError?.('Could not copy ticket code.');
        }
    }

    async function shareTicket() {
        const code = ticket?.code;
        const match = ticket?.match;
        const title = match
            ? `${match.home?.short || match.home?.name || 'Home'} vs ${match.away?.short || match.away?.name || 'Away'}`
            : 'Mad Fan ticket';
        const text = `Mad Fan gate pass ${code || ''} — ${statusLabel(ticket?.status)}`;
        const url = `${window.location.origin}/social/tickets/${ticketId}`;

        try {
            if (navigator.share) {
                await navigator.share({ title, text, url });
                reportSuccess?.('Share sheet opened.');
                return;
            }

            await navigator.clipboard.writeText(url);
            reportSuccess?.('Ticket link copied.');
        } catch (error) {
            if (error?.name === 'AbortError') {
                return;
            }
            reportError?.('Could not share ticket.');
        }
    }

    return (
        <div className="mf-ticket-modal" role="presentation">
            <button
                type="button"
                className="mf-ticket-modal__backdrop"
                aria-label="Close ticket"
                onClick={onClose}
            />
            <div
                className="mf-ticket-modal__panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
            >
                <div className="mf-ticket-modal__chrome">
                    <div>
                        <p className="mf-text-caption text-[var(--mf-pitch)]">Gate pass</p>
                        <h2 id={titleId} className="mf-display mf-ticket-modal__title">
                            {ticket?.code || 'Stadium ticket'}
                        </h2>
                    </div>
                    <button
                        ref={closeRef}
                        type="button"
                        className="mf-ticket-modal__close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <div className="mf-ticket-modal__scroll">
                    {loading && !ticket ? (
                        <div className="mf-ticket-modal__skel" aria-busy="true" aria-label="Loading ticket">
                            <span className="mf-skel-bone mf-ticket-modal__skel-face" aria-hidden />
                            <span className="mf-skel-bone mf-ticket-modal__skel-receipt" aria-hidden />
                        </div>
                    ) : ticket ? (
                        <>
                            <StadiumTicketFace ticket={ticket} />

                            {ticket.qr_payload ? (
                                <div className="mf-ticket-modal__qr-tools">
                                    <button
                                        type="button"
                                        className="mf-btn mf-btn--ghost"
                                        onClick={() => setQrExpanded((value) => !value)}
                                    >
                                        {qrExpanded ? 'Shrink QR' : 'Enlarge QR'}
                                    </button>
                                    {qrExpanded ? (
                                        <div className="mf-ticket-modal__qr-xl">
                                            <PassportQrCode
                                                value={ticket.qr_payload}
                                                size={220}
                                                className="mf-stk__qr-frame"
                                                title="Stadium entry QR enlarged"
                                            />
                                            <p className="mf-text-meta text-[var(--mf-muted)]">
                                                Hold to the turnstile scanner
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}

                            <StadiumTicketReceipt ticket={ticket} />
                        </>
                    ) : (
                        <div className="mf-empty mf-empty--compact">
                            <p className="mf-empty-title">Ticket unavailable</p>
                            <p>Try again from your wallet.</p>
                        </div>
                    )}
                </div>

                <div className="mf-ticket-modal__actions">
                    <button type="button" className="mf-btn mf-btn--ghost" onClick={copyCode} disabled={!ticket?.code}>
                        Copy code
                    </button>
                    <button type="button" className="mf-btn mf-btn--muted" onClick={shareTicket} disabled={!ticket}>
                        Share
                    </button>
                    <button
                        type="button"
                        className="mf-btn mf-btn--pitch"
                        onClick={() => window.print()}
                        disabled={!ticket}
                    >
                        Print
                    </button>
                </div>
            </div>
        </div>
    );
}
