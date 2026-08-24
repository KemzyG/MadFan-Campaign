import { useEffect, useState } from 'react';

/**
 * Clock helpers for the events feed. `formatRelative` in ../post/format clamps
 * future timestamps to zero, so anything counting *down* lives here.
 */

/** Re-render on an interval. Pass 0 to freeze (e.g. nothing to count down to). */
export function useNow(intervalMs = 30000) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!intervalMs) {
            return undefined;
        }

        const id = setInterval(() => setNow(Date.now()), intervalMs);

        return () => clearInterval(id);
    }, [intervalMs]);

    return now;
}

export function toMillis(iso) {
    if (!iso) {
        return null;
    }

    const value = new Date(iso).getTime();

    return Number.isNaN(value) ? null : value;
}

/**
 * Split a remaining duration into display parts.
 *
 * @returns {{past: boolean, days: number, hours: number, minutes: number, seconds: number}}
 */
export function splitDuration(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));

    return {
        past: ms <= 0,
        days: Math.floor(total / 86400),
        hours: Math.floor((total % 86400) / 3600),
        minutes: Math.floor((total % 3600) / 60),
        seconds: total % 60,
    };
}

/** Compact countdown: "2d 4h", "4h 12m", "12m 30s", "30s". */
export function formatCountdown(ms) {
    const { days, hours, minutes, seconds } = splitDuration(ms);

    if (days > 0) {
        return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    }
    if (hours > 0) {
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    if (minutes > 0) {
        return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
    }

    return `${seconds}s`;
}

/**
 * A ticking countdown to `iso`. Ticks every second inside the last two minutes
 * so the final approach feels live, and every 30s before that.
 *
 * @returns {{target: number|null, remaining: number, past: boolean, label: string, parts: object}}
 */
export function useCountdown(iso) {
    const target = toMillis(iso);
    const coarse = useNow(30000);
    const roughRemaining = target === null ? 0 : target - coarse;
    const fine = useNow(target !== null && roughRemaining > 0 && roughRemaining < 120000 ? 1000 : 0);
    const now = Math.max(coarse, fine);
    const remaining = target === null ? 0 : target - now;

    return {
        target,
        remaining,
        past: target === null ? true : remaining <= 0,
        label: target === null ? '' : formatCountdown(remaining),
        parts: splitDuration(remaining),
    };
}

/** How long something has been running: "24'" style elapsed minutes. */
export function useElapsed(iso) {
    const target = toMillis(iso);
    const now = useNow(30000);

    if (target === null) {
        return null;
    }

    return Math.max(0, Math.floor((now - target) / 60000));
}

/** "Sat 20:45" — the kickoff / doors-open stamp. */
export function formatKickoff(iso) {
    if (!iso) {
        return '';
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            weekday: 'short',
            hour: 'numeric',
            minute: '2-digit',
        }).format(new Date(iso));
    } catch {
        return '';
    }
}

/** "20:45" — clock only. */
export function formatClock(iso) {
    if (!iso) {
        return '';
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            hour: 'numeric',
            minute: '2-digit',
        }).format(new Date(iso));
    } catch {
        return '';
    }
}

/** "Today" / "Tomorrow" / "Sat 24 Aug". */
export function formatDayLabel(iso) {
    const target = toMillis(iso);
    if (target === null) {
        return '';
    }

    const startOfDay = (ms) => {
        const date = new Date(ms);
        date.setHours(0, 0, 0, 0);

        return date.getTime();
    };

    const days = Math.round((startOfDay(target) - startOfDay(Date.now())) / 86400000);

    if (days === 0) {
        return 'Today';
    }
    if (days === 1) {
        return 'Tomorrow';
    }
    if (days === -1) {
        return 'Yesterday';
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        }).format(new Date(target));
    } catch {
        return '';
    }
}

/** Seconds → "12:34" / "1:02:03". */
export function formatDuration(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    return `${minutes}:${String(secs).padStart(2, '0')}`;
}
