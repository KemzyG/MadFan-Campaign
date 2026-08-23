import { usePage } from '@inertiajs/react';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';

/**
 * Shared, dependency-light helpers for the Stage room components.
 * Mirrors `Social/Chat/helpers.jsx` so avatars and derivations look identical
 * across the two features.
 */

const AVATAR_SIZES = {
    xs: 'h-7 w-7',
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-14 w-14',
    xl: 'h-20 w-20',
};

/** First letter of a display name/handle, upper-cased, with a safe fallback. */
export function initials(user) {
    const source = user?.name || user?.handle || '?';

    return source.slice(0, 1).toUpperCase();
}

/**
 * Round avatar for a Stage user. Falls back to the app default image on a broken
 * URL, then to the user's emoji, then to their initial — same ladder as chat.
 */
export function StageAvatar({ user, size = 'md', className = '' }) {
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });
    const sizeClass = AVATAR_SIZES[size] ?? AVATAR_SIZES.md;

    if (user?.avatar_url) {
        return (
            <img
                src={user.avatar_url}
                alt=""
                className={`mf-avatar ${sizeClass} ${className}`.trim()}
                onError={(event) => onImageError(event, fallbackUrl)}
            />
        );
    }

    return (
        <span className={`mf-avatar mf-text-meta ${sizeClass} ${className}`.trim()} aria-hidden>
            {user?.avatar_emoji || initials(user)}
        </span>
    );
}

function pad(value) {
    return String(value).padStart(2, '0');
}

/**
 * Running "on air" duration since `startedAt`. Pass a ticking `now` (ms) so the
 * component re-renders every second. Returns `M:SS`, or `H:MM:SS` past an hour.
 */
export function formatLiveDuration(startedAt, now = Date.now()) {
    if (!startedAt) {
        return '0:00';
    }

    const start = new Date(startedAt).getTime();
    if (!Number.isFinite(start)) {
        return '0:00';
    }

    const totalSeconds = Math.max(0, Math.floor((now - start) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    }

    return `${minutes}:${pad(seconds)}`;
}

/** Human label for a participant role. */
export function roleLabel(role) {
    switch (role) {
        case 'host':
            return 'Host';
        case 'co-host':
            return 'Co-host';
        case 'speaker':
            return 'Speaker';
        default:
            return 'Listener';
    }
}

const ROLE_RANK = { host: 0, 'co-host': 1, speaker: 2, listener: 3 };

function rankOf(participant) {
    return ROLE_RANK[participant?.role] ?? 3;
}

/**
 * Split the flat participant list into the three groups the room renders:
 * on-stage speakers (host first), listeners, and the raised-hand queue
 * (oldest request first, so the host works the queue top-down).
 */
export function partitionParticipants(participants = []) {
    const speakers = [];
    const listeners = [];
    const handRaised = [];

    for (const participant of participants) {
        if (participant?.banned_at) {
            continue;
        }

        if (participant?.on_stage) {
            speakers.push(participant);
        } else {
            listeners.push(participant);
            if (participant?.speak_requested_at) {
                handRaised.push(participant);
            }
        }
    }

    speakers.sort((a, b) => rankOf(a) - rankOf(b) || nameOf(a).localeCompare(nameOf(b)));
    listeners.sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
    handRaised.sort(
        (a, b) => new Date(a.speak_requested_at) - new Date(b.speak_requested_at),
    );

    return { speakers, listeners, handRaised };
}

function nameOf(participant) {
    return participant?.user?.name || participant?.user?.handle || '';
}

/** True when this participant is the signed-in user (compares by user id). */
export function isMe(participant, me) {
    return Boolean(participant && me) && participant.user_id === me.user_id;
}
