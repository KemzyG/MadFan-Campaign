/**
 * Events feed iconography — one 24×24 line set, stroke: currentColor, sized by
 * CSS. One icon per event type plus the shared action glyphs.
 */

/** live_match — football. */
export function IconBall() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <circle cx="12" cy="12" r="9" strokeWidth="1.75" />
            <path
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="m12 7.6 3.4 2.5-1.3 4h-4.2l-1.3-4L12 7.6Z"
            />
            <path strokeLinecap="round" strokeWidth="1.35" d="M12 3v4.6M20.6 10.1l-5.2 0M18.1 19.4l-4-5.3M5.9 19.4l4-5.3M3.4 10.1l5.2 0" />
        </svg>
    );
}

/** tournament — trophy. */
export function IconTrophy() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M7.5 4h9v4.5a4.5 4.5 0 0 1-9 0V4Z" />
            <path strokeLinecap="round" strokeWidth="1.6" d="M7.5 5.5H5a2 2 0 0 0 2.6 1.9M16.5 5.5H19a2 2 0 0 1-2.6 1.9" />
            <path strokeLinecap="round" strokeWidth="1.75" d="M12 13v3.5M8.5 20h7M9.8 20c0-1.9.7-3.5 2.2-3.5s2.2 1.6 2.2 3.5" />
        </svg>
    );
}

/** livestream — broadcast waves around a dot. */
export function IconBroadcast() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
            <path strokeLinecap="round" strokeWidth="1.75" d="M7.4 7.4a6.5 6.5 0 0 0 0 9.2M16.6 16.6a6.5 6.5 0 0 0 0-9.2" />
            <path strokeLinecap="round" strokeWidth="1.5" opacity="0.55" d="M4.4 4.4a10.6 10.6 0 0 0 0 15.2M19.6 19.6a10.6 10.6 0 0 0 0-15.2" />
        </svg>
    );
}

/** live_event — a gathering: mic in a room. */
export function IconMic() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <rect x="9.25" y="2.75" width="5.5" height="10.5" rx="2.75" strokeWidth="1.75" />
            <path strokeLinecap="round" strokeWidth="1.75" d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
        </svg>
    );
}

/** new_episode — play in a frame. */
export function IconPlay() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <rect x="3" y="4.75" width="18" height="14.5" rx="2.4" strokeWidth="1.75" />
            <path fill="currentColor" stroke="none" d="M10.4 8.9 15.6 12l-5.2 3.1V8.9Z" />
        </svg>
    );
}

/** campaign — pennant on a pole. */
export function IconFlag() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeWidth="1.85" d="M6.5 3v18" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M6.5 4.5h11l-2.4 3.6 2.4 3.6h-11" />
        </svg>
    );
}

/** fan_challenge — target with an arrow. */
export function IconTarget() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <circle cx="12" cy="12" r="8.5" strokeWidth="1.6" />
            <circle cx="12" cy="12" r="4.75" strokeWidth="1.6" />
            <circle cx="12" cy="12" r="1.35" fill="currentColor" stroke="none" />
        </svg>
    );
}

/** concert — music notes. */
export function IconMusic() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <circle cx="7" cy="17.5" r="2.75" strokeWidth="1.75" />
            <circle cx="17.5" cy="15.5" r="2.75" strokeWidth="1.75" />
            <path strokeLinecap="round" strokeWidth="1.75" d="M9.75 17.5V7.6l10.5-2.4v10.3" />
        </svg>
    );
}

/** song_release — vinyl disc. */
export function IconDisc() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <circle cx="12" cy="12" r="9" strokeWidth="1.75" />
            <circle cx="12" cy="12" r="4" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
        </svg>
    );
}

/** breaking_news — alert siren. */
export function IconAlert() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.75"
                d="M12 3.4 21 19.4H3L12 3.4Z"
            />
            <path strokeLinecap="round" strokeWidth="1.9" d="M12 9.5v4.2" />
            <circle cx="12" cy="16.6" r="1" fill="currentColor" stroke="none" />
        </svg>
    );
}

/** Interest — a bolt (I'm in). */
export function IconBolt({ filled }) {
    return filled ? (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M13.4 2 5.8 13.1h4.6L9.9 22l7.9-11.4h-4.8L13.4 2Z" />
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.75"
                d="M13.4 2.8 6.6 12.7h4.4l-.5 8.1 6.9-10.2h-4.4l.4-7.8Z"
            />
        </svg>
    );
}

export function IconShare() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 3.5v11" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="m8.2 7 3.8-3.5L15.8 7" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M5.5 12.5v6.2a1.8 1.8 0 0 0 1.8 1.8h9.4a1.8 1.8 0 0 0 1.8-1.8v-6.2" />
        </svg>
    );
}

/** Venue / city. */
export function IconPin() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 21c4-4.4 6-7.5 6-10.2A6 6 0 0 0 6 10.8C6 13.5 8 16.6 12 21Z" />
            <circle cx="12" cy="10.5" r="2.25" strokeWidth="1.6" />
        </svg>
    );
}

export function IconClock() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <circle cx="12" cy="12" r="8.5" strokeWidth="1.6" />
            <path strokeLinecap="round" strokeWidth="1.75" d="M12 7.4V12l3.2 2" />
        </svg>
    );
}

/** Points / reward coin. */
export function IconCoin() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <circle cx="12" cy="12" r="8.5" strokeWidth="1.6" />
            <path strokeLinecap="round" strokeWidth="1.75" d="M14.4 9.4a2.9 2.9 0 0 0-2.4-1.1c-1.5 0-2.4.8-2.4 1.9 0 2.6 5 1.2 5 3.7 0 1.2-1 2-2.6 2a3 3 0 0 1-2.5-1.2M12 6.6v10.8" />
        </svg>
    );
}

/** External destination. */
export function IconExternal() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M14 4.5h5.5V10M19 5l-7.5 7.5" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M18 14.5v4.2a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 18.7V8.3a1.8 1.8 0 0 1 1.8-1.8H10" />
        </svg>
    );
}

/** Per-type glyph for the card byline. */
export const EVENT_ICONS = {
    live_match: IconBall,
    tournament: IconTrophy,
    livestream: IconBroadcast,
    live_event: IconMic,
    new_episode: IconPlay,
    campaign: IconFlag,
    fan_challenge: IconTarget,
    concert: IconMusic,
    song_release: IconDisc,
    breaking_news: IconAlert,
};
