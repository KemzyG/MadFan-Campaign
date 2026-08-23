import { StageAvatar, roleLabel } from './helpers';
import { IconCrown, IconMicOff } from './StageIcons';

/**
 * One speaker on the deck: avatar with an active-speaker ring, host crown, and a
 * mute glyph. When `onSelect` is provided (host viewing someone else) the tile
 * becomes a button that opens that participant's moderation actions.
 */
export default function SpeakerTile({ participant, speaking = false, me = false, onSelect }) {
    const user = participant.user;
    const isHost = participant.role === 'host';
    const muted = Boolean(participant.is_muted);
    const clickable = typeof onSelect === 'function';

    const className = [
        'mf-stage-tile',
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
            <span className="mf-stage-tile__avatar-wrap">
                <span className="mf-stage-tile__ring" aria-hidden />
                <StageAvatar user={user} size="xl" className="mf-stage-tile__avatar" />
                {isHost ? (
                    <span className="mf-stage-tile__crown" aria-hidden>
                        <IconCrown />
                    </span>
                ) : null}
                {muted ? (
                    <span className="mf-stage-tile__mic is-muted" aria-hidden>
                        <IconMicOff />
                    </span>
                ) : null}
            </span>
            <span className="mf-stage-tile__name" title={user?.name || 'Fan'}>
                {user?.name || 'Fan'}
                {me ? ' (you)' : ''}
            </span>
            <span className="mf-stage-tile__role mf-mono">{roleLabel(participant.role)}</span>
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
