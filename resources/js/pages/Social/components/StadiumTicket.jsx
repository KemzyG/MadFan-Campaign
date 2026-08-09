import PassportQrCode from '../../../Components/Fan/PassportQrCode';

function formatKickoff(iso, style = 'long') {
    if (!iso) {
        return 'TBC';
    }

    try {
        const opts =
            style === 'short'
                ? {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                  }
                : {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                  };

        return new Intl.DateTimeFormat(undefined, opts).format(new Date(iso));
    } catch {
        return iso;
    }
}

function formatIssued(iso) {
    if (!iso) {
        return '—';
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}

function statusLabel(status) {
    if (status === 'paid') {
        return 'Entry ready';
    }
    if (status === 'used') {
        return 'Scanned';
    }
    if (status === 'pending') {
        return 'Pending';
    }

    return status || 'Issued';
}

function ClubMark({ club, className = '' }) {
    if (club?.logo_url) {
        return <img src={club.logo_url} alt="" className={className} decoding="async" />;
    }

    return (
        <span className={`${className} mf-stk-crest__mark mf-display`} aria-hidden>
            {(club?.short || club?.name || '?').slice(0, 3)}
        </span>
    );
}

/**
 * Physical matchday ticket face — paper stock, perforated stub, gate QR.
 *
 * @param {{
 *   ticket: object,
 *   variant?: 'full' | 'wallet',
 *   freshlyIssued?: boolean,
 * }} props
 */
export function StadiumTicketFace({ ticket, variant = 'full', freshlyIssued = false }) {
    const match = ticket?.match;
    const home = match?.home?.short || match?.home?.name || 'Home';
    const away = match?.away?.short || match?.away?.name || 'Away';
    const section = ticket?.section || 'General Admission';
    const isWallet = variant === 'wallet';

    return (
        <article
            className={[
                'mf-stk',
                isWallet ? 'mf-stk--wallet' : 'mf-stk--full',
                freshlyIssued ? 'mf-stk--fresh' : '',
            ]
                .filter(Boolean)
                .join(' ')}
            aria-label={`Stadium ticket ${ticket?.code || ''}`}
        >
            <div className="mf-stk__paper" aria-hidden />
            <div className="mf-stk__grain" aria-hidden />

            <div className="mf-stk__body">
                <header className="mf-stk__mast">
                    <div className="mf-stk__brand">
                        <span className="mf-stk__brand-dot" aria-hidden />
                        <span className="mf-display mf-stk__brand-name">MAD FAN</span>
                        <span className="mf-stk__brand-slash" aria-hidden>
                            /
                        </span>
                        <span className="mf-stk__brand-doc">Matchday ticket</span>
                    </div>
                    <span className="mf-mono mf-stk__status">{statusLabel(ticket?.status)}</span>
                </header>

                <p className="mf-stk__comp mf-text-caption">{match?.competition || 'Matchday'}</p>

                <div className="mf-stk__fixture">
                    <div className="mf-stk__side">
                        <span className="mf-stk-crest">
                            <ClubMark club={match?.home} className="mf-stk-crest__img" />
                        </span>
                        <span className="mf-display mf-stk__club">{isWallet ? home : match?.home?.name || home}</span>
                    </div>
                    <span className="mf-display mf-stk__vs" aria-hidden>
                        V
                    </span>
                    <div className="mf-stk__side mf-stk__side--away">
                        <span className="mf-stk-crest">
                            <ClubMark club={match?.away} className="mf-stk-crest__img" />
                        </span>
                        <span className="mf-display mf-stk__club">{isWallet ? away : match?.away?.name || away}</span>
                    </div>
                </div>

                <div className="mf-stk__grid">
                    <div className="mf-stk__cell">
                        <span className="mf-stk__k">Kick-off</span>
                        <span className="mf-stk__v">{formatKickoff(match?.kickoff_at, isWallet ? 'short' : 'long')}</span>
                    </div>
                    <div className="mf-stk__cell">
                        <span className="mf-stk__k">Venue</span>
                        <span className="mf-stk__v">{match?.venue || 'Stadium TBC'}</span>
                    </div>
                    <div className="mf-stk__cell">
                        <span className="mf-stk__k">Section</span>
                        <span className="mf-stk__v mf-mono">{section}</span>
                    </div>
                    <div className="mf-stk__cell">
                        <span className="mf-stk__k">Price</span>
                        <span className="mf-stk__v mf-mono">£{ticket?.price}</span>
                    </div>
                </div>

                {!isWallet ? (
                    <div className="mf-stk__holder">
                        <div>
                            <span className="mf-stk__k">Holder</span>
                            <span className="mf-stk__v">{ticket?.holder?.name || 'Fan'}</span>
                        </div>
                        <div>
                            <span className="mf-stk__k">Fan ID</span>
                            <span className="mf-stk__v mf-mono">{ticket?.holder?.fan_id || '—'}</span>
                        </div>
                    </div>
                ) : null}

                <p className="mf-stk__watermark mf-display" aria-hidden>
                    Admit one
                </p>
            </div>

            <div className="mf-stk__perf" aria-hidden>
                <span className="mf-stk__perf-notch mf-stk__perf-notch--top" />
                <span className="mf-stk__perf-line" />
                <span className="mf-stk__perf-notch mf-stk__perf-notch--bottom" />
            </div>

            <aside className="mf-stk__stub">
                <p className="mf-stk__stub-label mf-text-caption">Gate stub</p>
                <p className="mf-display mf-stk__stub-ga">GA</p>
                <p className="mf-mono mf-stk__stub-code">{ticket?.code}</p>

                {!isWallet && ticket?.qr_payload ? (
                    <div className="mf-stk__qr">
                        <PassportQrCode
                            value={ticket.qr_payload}
                            size={132}
                            className="mf-stk__qr-frame"
                            title="Stadium entry QR"
                        />
                        <p className="mf-stk__qr-hint">Scan at turnstile</p>
                    </div>
                ) : (
                    <div className="mf-stk__barcode" aria-hidden>
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                    </div>
                )}

                <p className="mf-stk__stub-foot mf-mono">MF · Season</p>
            </aside>
        </article>
    );
}

/**
 * Ticket-wallet printout / purchase receipt.
 *
 * @param {{ ticket: object, highlight?: boolean }} props
 */
export function StadiumTicketReceipt({ ticket, highlight = false }) {
    const match = ticket?.match;
    const home = match?.home?.name || match?.home?.short || 'Home';
    const away = match?.away?.name || match?.away?.short || 'Away';
    const section = ticket?.section || 'General Admission';
    const seat = ticket?.seat ? String(ticket.seat) : 'Standing / unreserved';

    const rows = [
        { n: '01', label: 'Order code', value: ticket?.code || '—' },
        { n: '02', label: 'Issued', value: formatIssued(ticket?.purchased_at) },
        { n: '03', label: 'Match', value: `${home} vs ${away}` },
        { n: '04', label: 'Price paid', value: `£${ticket?.price}` },
        { n: '05', label: 'Seat / section', value: `${section} · ${seat}` },
    ];

    return (
        <section
            className={['mf-stk-receipt', highlight ? 'mf-stk-receipt--fresh' : ''].filter(Boolean).join(' ')}
            aria-label="Ticket purchase receipt"
        >
            <div className="mf-stk-receipt__head">
                <p className="mf-stk-receipt__kicker mf-text-caption">Mad Fan ticket wallet</p>
                <p className="mf-display mf-stk-receipt__title">Purchase receipt</p>
                {highlight ? (
                    <p className="mf-stk-receipt__flash">Just issued — keep this with your gate pass.</p>
                ) : null}
            </div>

            <ol className="mf-stk-receipt__list">
                {rows.map((row) => (
                    <li key={row.n} className="mf-stk-receipt__row">
                        <span className="mf-mono mf-stk-receipt__n">{row.n}</span>
                        <span className="mf-stk-receipt__label">{row.label}</span>
                        <span className="mf-stk-receipt__value">{row.value}</span>
                    </li>
                ))}
            </ol>

            <p className="mf-stk-receipt__terms">
                Non-transferable digital pass linked to the named holder&apos;s Fan ID. Present the QR at the
                turnstile. Subject to ground regulations and competition rules. No cash refund once issued.
            </p>
        </section>
    );
}

export { formatKickoff, formatIssued, statusLabel };
