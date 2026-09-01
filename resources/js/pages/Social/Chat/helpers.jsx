import { usePage } from '@inertiajs/react';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';

export const INBOXES = [
    { id: 'friends', label: 'Friends' },
    { id: 'groups', label: 'Group' },
    { id: 'fandom', label: 'Fandom' },
];

export function inboxHref(inbox) {
    // Friends is the default landing segment (ChatService::normalizeInbox),
    // so every tab — including Fandom — needs its inbox spelled out explicitly;
    // a bare /social/chat would now resolve back to Friends instead.
    return `/social/chat?inbox=${inbox}`;
}

export function formatTime(iso) {
    if (!iso) {
        return '';
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(iso));
    } catch {
        return '';
    }
}

function sameDay(a, b) {
    return (
        a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate()
    );
}

export function formatDayLabel(iso) {
    if (!iso) {
        return '';
    }

    try {
        const date = new Date(iso);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (sameDay(date, today)) {
            return 'Today';
        }
        if (sameDay(date, yesterday)) {
            return 'Yesterday';
        }

        return new Intl.DateTimeFormat(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        }).format(date);
    } catch {
        return '';
    }
}

/** Conversation-list stamp: time today, "Yesterday", then a short date. */
export function formatListStamp(iso) {
    if (!iso) {
        return '';
    }

    try {
        const date = new Date(iso);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (sameDay(date, today)) {
            return formatTime(iso);
        }
        if (sameDay(date, yesterday)) {
            return 'Yesterday';
        }

        return new Intl.DateTimeFormat(undefined, {
            month: 'short',
            day: 'numeric',
        }).format(date);
    } catch {
        return '';
    }
}

/** Direct-thread / roster status line: "Active now", "Active 5m ago", … "Active Aug 12". */
export function formatLastSeen(iso) {
    if (!iso) {
        return 'Offline';
    }

    try {
        const date = new Date(iso);
        const now = new Date();
        const mins = Math.floor((now - date) / 60000);

        if (mins < 1) {
            return 'Active now';
        }
        if (mins < 60) {
            return `Active ${mins}m ago`;
        }

        const hours = Math.floor(mins / 60);
        if (hours < 24) {
            return `Active ${hours}h ago`;
        }

        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        if (sameDay(date, yesterday)) {
            return 'Active yesterday';
        }

        return `Active ${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)}`;
    } catch {
        return 'Offline';
    }
}

/** Monochrome presence indicator: solid when online, hollow ring when not. */
export function PresenceDot({ online = false, className = '' }) {
    return (
        <span
            className={`mf-presence-dot ${className}`.trim()}
            data-online={online ? 'true' : 'false'}
            aria-hidden
        />
    );
}

export function dayKey(iso) {
    if (!iso) {
        return '';
    }

    try {
        const d = new Date(iso);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    } catch {
        return '';
    }
}

export function isGroupedWith(previous, message) {
    if (!previous) {
        return false;
    }

    return (
        previous.author?.id === message.author?.id
        && Boolean(previous.is_mine) === Boolean(message.is_mine)
        && dayKey(previous.created_at) === dayKey(message.created_at)
        && !message.reply_to
        && Math.abs(new Date(message.created_at) - new Date(previous.created_at)) < 5 * 60 * 1000
    );
}

export function AuthorAvatar({ author, size = 'md' }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });
    const sizeClass = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';

    if (author?.avatar_url) {
        return (
            <img
                src={author.avatar_url}
                alt=""
                className={`mf-avatar ${sizeClass}`}
                onError={(event) => onImageError(event, fallbackUrl)}
            />
        );
    }

    const label = (author?.name || author?.handle || '?').slice(0, 1).toUpperCase();

    return (
        <span className={`mf-avatar mf-text-meta ${sizeClass}`} aria-hidden>
            {author?.avatar_emoji || label}
        </span>
    );
}

/**
 * Scroll to a message in the current stream and pulse it.
 *
 * @returns {boolean} false when the message is outside the loaded window.
 */
export function jumpToMessage(id) {
    const el = document.getElementById(`mf-msg-${id}`);
    if (!el) {
        return false;
    }

    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.classList.remove('is-flash');
    // Force a reflow so the animation restarts on a repeat jump.
    void el.offsetWidth;
    el.classList.add('is-flash');
    window.setTimeout(() => el.classList.remove('is-flash'), 1200);

    return true;
}
