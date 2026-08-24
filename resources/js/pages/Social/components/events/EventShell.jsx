import { Link } from '@inertiajs/react';
import EventActions from './EventActions';
import { PhasePill } from './EventChrome';
import { EVENT_ICONS } from './icons';
import { formatRelative } from '../post/format';

function ClubBadge({ club }) {
    if (!club) {
        return null;
    }

    return (
        <span className="mf-ev-club">
            {club.logo_url ? (
                <img src={club.logo_url} alt="" loading="lazy" />
            ) : (
                <span className="mf-ev-club__fallback" aria-hidden>
                    {(club.short || club.name || '?').slice(0, 3).toUpperCase()}
                </span>
            )}
            <span>{club.short || club.name}</span>
        </span>
    );
}

/**
 * Shared chrome for every events-feed template: the byline (type glyph, label,
 * club, phase pill, timestamp), the template's own body, and the action row.
 *
 * The body is entirely owned by each template — that is where the ten types
 * diverge. Everything here is the part that must stay identical so the feed
 * still reads as one stream.
 *
 * @param {{
 *   event: object,
 *   children: import('react').ReactNode,
 *   tone?: string,
 *   showActions?: boolean,
 *   bleed?: boolean,
 *   aside?: import('react').ReactNode,
 * }} props
 */
export default function EventShell({
    event,
    children,
    tone = 'pitch',
    showActions = true,
    bleed = false,
    aside = null,
}) {
    const Icon = EVENT_ICONS[event.type];
    const stamp = event.phase === 'upcoming' ? '' : formatRelative(event.timestamp);

    return (
        <article
            className={`mf-ev mf-ev--${event.type}${bleed ? ' is-bleed' : ''}`}
            data-phase={event.phase}
            aria-label={`${event.label}: ${event.headline}`}
        >
            <header className="mf-ev__top">
                <span className="mf-ev__kind">
                    {Icon ? <Icon /> : null}
                    <span>{event.label}</span>
                </span>

                {event.club ? (
                    event.club.id ? (
                        <Link href={`/social/clubs?club=${event.club.id}`} className="mf-ev__club-link">
                            <ClubBadge club={event.club} />
                        </Link>
                    ) : (
                        <ClubBadge club={event.club} />
                    )
                ) : null}

                <span className="mf-ev__spacer" />

                <PhasePill phase={event.phase} pill={event.pill} timestamp={event.timestamp} />
                {stamp ? <time className="mf-ev__stamp">{stamp}</time> : null}
            </header>

            <div className="mf-ev__body">{children}</div>

            {aside}

            {showActions ? <EventActions event={event} tone={tone} /> : null}
        </article>
    );
}
