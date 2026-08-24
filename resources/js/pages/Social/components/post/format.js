/**
 * Shared formatting helpers for Social post surfaces.
 */

export function formatTime(iso) {
    if (!iso) {
        return '';
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            month: 'short',
            day: 'numeric',
        }).format(new Date(iso));
    } catch {
        return '';
    }
}

/**
 * Absolute, spelled-out timestamp for detail views (e.g. the thread root).
 */
export function formatFullTime(iso) {
    if (!iso) {
        return '';
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }).format(new Date(iso));
    } catch {
        return '';
    }
}

/**
 * Compact "since" label used on relative timestamps (e.g. "3h", "2d").
 */
export function formatRelative(iso) {
    if (!iso) {
        return '';
    }

    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) {
        return '';
    }

    const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));

    if (seconds < 60) {
        return `${seconds}s`;
    }
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
        return `${minutes}m`;
    }
    const hours = Math.round(minutes / 60);
    if (hours < 24) {
        return `${hours}h`;
    }
    const days = Math.round(hours / 24);
    if (days < 7) {
        return `${days}d`;
    }

    return formatTime(iso);
}

export function formatCount(value) {
    const n = Number(value) || 0;
    if (n >= 1_000_000) {
        return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
    }
    if (n >= 10_000) {
        return `${Math.round(n / 1000)}K`;
    }
    if (n >= 1000) {
        return `${(n / 1000).toFixed(1)}K`;
    }
    return String(n);
}
