import { StageAvatar } from './helpers';
import { IconCrown, IconMicOff, IconPlus } from './StageIcons';

/**
 * One square on the voice-room seat grid: either an occupied speaker (avatar,
 * name, host crown, mute glyph) or an empty glass slot showing a "+" a
 * listener can tap to claim, or the host can tap to invite someone into.
 *
 * Distinct from `SpeakerTile` (used by the Video/Streaming hero deck's small
 * chip row) so this grid's glass-square styling never leaks into that
 * unrelated layout.
 */
export default function SeatTile({
    participant = null,
    speaking = false,
    me = false,
    onSelect,
    onClaim,
    label = 'Open seat',
}) {
    if (!participant) {
        const clickable = typeof onClaim === 'function';

        return (
            <button
                type="button"
                className={`mf-seat mf-seat--empty ${clickable ? 'is-clickable' : ''}`.trim()}
                aria-label={label}
                title={label}
                onClick={clickable ? onClaim : undefined}
                disabled={!clickable}
            >
                <span className="mf-seat__plus" aria-hidden>
                    <IconPlus />
                </span>
            </button>
        );
    }

    const user = participant.user;
    const isHost = participant.role === 'host';
    const muted = Boolean(participant.is_muted);
    const clickable = typeof onSelect === 'function';

    const className = [
        'mf-seat',
        speaking && !muted ? 'is-speaking' : '',
        muted ? 'is-muted' : '',
        isHost ? 'is-host' : '',
        me ? 'is-me' : '',
        clickable ? 'is-clickable' : '',
    ]
        .filter(Boolean)
        .join(' ');

    const inner = (
        <>
            <span className="mf-seat__avatar-wrap">
                <StageAvatar user={user} size="sm" className="mf-seat__avatar" />
                {isHost ? (
                    <span className="mf-seat__crown" aria-hidden>
                        <IconCrown />
                    </span>
                ) : null}
                {muted ? (
                    <span className="mf-seat__mic" aria-hidden>
                        <IconMicOff />
                    </span>
                ) : null}
            </span>
            <span className="mf-seat__name truncate" title={user?.name || 'Fan'}>
                {user?.name || 'Fan'}
                {me ? ' (you)' : ''}
            </span>
        </>
    );

    if (clickable) {
        return (
            <button
                type="button"
                className={className}
                aria-label={`${user?.name || 'Fan'} — options`}
                onClick={() => onSelect(participant)}
            >
                {inner}
            </button>
        );
    }

    return <div className={className}>{inner}</div>;
}
