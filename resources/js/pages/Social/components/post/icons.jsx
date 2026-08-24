/**
 * Post iconography — a single, consistent 24×24 line set (stroke: currentColor).
 * Sizing/weight is controlled by CSS (`.mf-action svg`, etc.).
 */

/** Speech bubble — the "comment" affordance (replaces the old reply arrow). */
export function IconComment() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 11.6c0 3.6-3.9 6.5-8.7 6.5-1 0-2-.12-2.9-.35L4 19.5l1.3-3.4C4.2 15 3.3 13.4 3.3 11.6 3.3 8 7.2 5.1 12 5.1s9 2.9 9 6.5Z"
            />
        </svg>
    );
}

export function IconHeart({ filled }) {
    return filled ? (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 20.5s-7.2-4.35-9.2-8.3C1.35 9.2 2.7 6 6.1 5.55c1.85-.24 3.45.7 4.4 2.05.95-1.35 2.55-2.29 4.4-2.05 3.4.45 4.75 3.65 3.3 6.65-2 3.95-9.2 8.3-9.2 8.3Z" />
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12.2 8.1A3.7 3.7 0 0 1 18 9.6c.7 1.9-.2 3.9-1.8 5.4L12 19.1l-4.2-4.1C6.2 13.5 5.3 11.5 6 9.6a3.7 3.7 0 0 1 5.8-1.8l.4.3Z"
            />
        </svg>
    );
}

export function IconRepost() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 9V8a3 3 0 0 1 3-3h10.5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.5 2 3.5 3-3.5 3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 15v1a3 3 0 0 1-3 3H6.5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 22 6 19l3.5-3" />
        </svg>
    );
}

export function IconQuote() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" d="M8 17h.01M12 17h.01M16 17h.01" />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.5 7.5A2.5 2.5 0 0 1 9 5h6a2.5 2.5 0 0 1 2.5 2.5v4A2.5 2.5 0 0 1 15 14H9.5L6.5 16.5V7.5Z"
            />
        </svg>
    );
}

export function IconViews() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V10M9.5 20V5M15 20v-8M20.5 20V8" />
        </svg>
    );
}

export function IconImage() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <rect x="3.5" y="5" width="17" height="14" rx="2" strokeWidth="1.75" />
            <circle cx="9" cy="10" r="1.6" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="m7.5 16.5 3.2-3.4 2.4 2.2 3-3.8 3.4 5" />
        </svg>
    );
}

export function IconMore() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="5" cy="12" r="1.75" />
            <circle cx="12" cy="12" r="1.75" />
            <circle cx="19" cy="12" r="1.75" />
        </svg>
    );
}

export function IconClose() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l12 12M18 6 6 18" />
        </svg>
    );
}

export function IconChevronLeft() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5l-7 7 7 7" />
        </svg>
    );
}

export function IconChevronRight() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
    );
}

export function IconChevronDown() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m6 9 6 6 6-6" />
        </svg>
    );
}

/** Public / anyone — globe. */
export function IconGlobe() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <circle cx="12" cy="12" r="9" strokeWidth="1.75" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3Z" />
        </svg>
    );
}

/** Club-only — shield crest. */
export function IconClubShield() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 3l7 2.5v5.5c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V5.5L12 3Z" />
        </svg>
    );
}

/** Only me — padlock. */
export function IconLock() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <rect x="5" y="10.5" width="14" height="10" rx="2" strokeWidth="1.75" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
        </svg>
    );
}

/** Tag friends — person with a plus. */
export function IconUserPlus() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15 20v-1.5a4 4 0 0 0-4-4H6.5a4 4 0 0 0-4 4V20" />
            <circle cx="8.75" cy="7.5" r="3.5" strokeWidth="1.75" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M19 8v6M22 11h-6" />
        </svg>
    );
}

/** People / participants. */
export function IconUsers() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
            <circle cx="9" cy="7.5" r="3.5" strokeWidth="1.75" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M22 20v-1.5a4 4 0 0 0-3-3.87M16 4.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

/** Emoji — smiley face. */
export function IconSmile() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <circle cx="12" cy="12" r="9" strokeWidth="1.75" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8.5 14a4 4 0 0 0 7 0" />
            <path strokeLinecap="round" d="M9 9.5h.01M15 9.5h.01" />
        </svg>
    );
}

/** Live — radiating broadcast dot (feed stage card). */
export function IconLive() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />
            <path strokeLinecap="round" strokeWidth="1.75" d="M6.7 6.7a7.5 7.5 0 0 0 0 10.6M17.3 17.3a7.5 7.5 0 0 0 0-10.6M4.2 4.2a11 11 0 0 0 0 15.6M19.8 19.8a11 11 0 0 0 0-15.6" />
        </svg>
    );
}
