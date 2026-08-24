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
            <path strokeLinecap="round" strokeLinejoin="round" d="m7 7 3-3 3 3" />
            <path strokeLinecap="round" d="M10 4v9a4 4 0 0 0 4 4h3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="m17 17-3 3-3-3" />
            <path strokeLinecap="round" d="M14 20V11a4 4 0 0 0-4-4H7" />
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
