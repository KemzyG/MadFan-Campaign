import { Link } from '@inertiajs/react';

function formatKickoff(iso) {
    if (!iso) {
        return null;
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        }).format(new Date(iso));
    } catch {
        return null;
    }
}

function CollectionSection({ title, count, emptyText, emptyHref, emptyCta, children }) {
    return (
        <section className="mf-pass-collection">
            <div className="mf-pass-collection__head">
                <h2 className="mf-pass-collection__title">{title}</h2>
                {count > 0 ? <span className="mf-pass-collection__count">{count}</span> : null}
            </div>

            {count > 0 ? (
                <div className="mf-pass-collection__row">{children}</div>
            ) : (
                <div className="mf-pass-collection__empty">
                    <p>{emptyText}</p>
                    {emptyHref ? (
                        <Link href={emptyHref} className="mf-pass-collection__empty-link">
                            {emptyCta} →
                        </Link>
                    ) : null}
                </div>
            )}
        </section>
    );
}

/**
 * Trophy-case view of a fan's jerseys/tickets/badges. Shared by the owner's
 * own Passport page and a visited fan's public Profile — `emptyLinks` gates
 * the "go get one" CTAs since a visitor can't act on someone else's behalf.
 */
export default function FanCollections({ collections, ownerFirstName, emptyLinks = true }) {
    const jerseys = collections?.jerseys ?? [];
    const tickets = collections?.tickets ?? [];
    const badges = collections?.badges ?? [];
    const possessive = ownerFirstName ? `${ownerFirstName}'s` : 'No';

    return (
        <>
            <CollectionSection
                title="Jerseys"
                count={jerseys.length}
                emptyText={emptyLinks ? 'No kits collected yet — the store has this season\'s.' : `${possessive} kits collected yet.`}
                emptyHref={emptyLinks ? '/social/shop' : null}
                emptyCta="Browse the store"
            >
                {jerseys.map((jersey) => (
                    <div key={jersey.id} className="mf-pass-jersey-card">
                        <div className="mf-pass-jersey-card__media">
                            {jersey.image_url ? (
                                <img src={jersey.image_url} alt="" loading="lazy" />
                            ) : (
                                <span className="mf-pass-jersey-card__fallback" aria-hidden>
                                    👕
                                </span>
                            )}
                            {jersey.quantity > 1 ? (
                                <span className="mf-pass-jersey-card__qty">×{jersey.quantity}</span>
                            ) : null}
                        </div>
                        <p className="mf-pass-jersey-card__name truncate">{jersey.name}</p>
                        <p className="mf-pass-jersey-card__meta truncate">
                            {[jersey.club_name, jersey.size].filter(Boolean).join(' · ') || '—'}
                        </p>
                    </div>
                ))}
            </CollectionSection>

            <CollectionSection
                title="Tickets"
                count={tickets.length}
                emptyText={emptyLinks ? 'No stubs yet — grab one from an upcoming fixture.' : `${possessive} stubs yet.`}
                emptyHref={emptyLinks ? '/social/fixtures' : null}
                emptyCta="See fixtures"
            >
                {tickets.map((ticket) => (
                    <div key={ticket.id} className="mf-pass-ticket-card">
                        <div className="mf-pass-ticket-card__teams">
                            {ticket.fixture?.home_logo_url ? (
                                <img src={ticket.fixture.home_logo_url} alt="" className="mf-pass-ticket-card__crest" />
                            ) : null}
                            <span className="mf-pass-ticket-card__vs">vs</span>
                            {ticket.fixture?.away_logo_url ? (
                                <img src={ticket.fixture.away_logo_url} alt="" className="mf-pass-ticket-card__crest" />
                            ) : null}
                        </div>
                        <p className="mf-pass-ticket-card__matchup truncate">
                            {ticket.fixture ? `${ticket.fixture.home} vs ${ticket.fixture.away}` : 'Match'}
                        </p>
                        <p className="mf-pass-ticket-card__meta truncate">
                            {[formatKickoff(ticket.fixture?.kickoff_at), ticket.fixture?.venue]
                                .filter(Boolean)
                                .join(' · ') || ticket.code}
                        </p>
                    </div>
                ))}
            </CollectionSection>

            <CollectionSection
                title="Badges"
                count={badges.length}
                emptyText={emptyLinks ? 'No badges yet — streaks and referrals earn them.' : `${possessive} badges yet.`}
            >
                <div className="mf-pass-badges">
                    {badges.map((badge) => (
                        <div key={badge.id} className={`mf-pass-badge mf-pass-badge--${badge.type}`}>
                            <span className="mf-pass-badge__icon" aria-hidden>
                                {badge.type === 'streak' ? '🔥' : '🎯'}
                            </span>
                            <span className="mf-pass-badge__name truncate">{badge.name}</span>
                        </div>
                    ))}
                </div>
            </CollectionSection>
        </>
    );
}
