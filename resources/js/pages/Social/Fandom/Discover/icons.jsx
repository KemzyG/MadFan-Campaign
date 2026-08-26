export function IconSearch({ className }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className={className}>
            <circle cx="11" cy="11" r="6.5" strokeWidth="1.75" />
            <path strokeLinecap="round" strokeWidth="1.75" d="m16 16 4 4" />
        </svg>
    );
}

export function IconFilter({ className }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className={className}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.75"
                d="M4 6h16M7 12h10M10 18h4"
            />
        </svg>
    );
}

export function IconClose({ className }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className={className}>
            <path strokeLinecap="round" strokeWidth="1.85" d="M6 6l12 12M18 6 6 18" />
        </svg>
    );
}
