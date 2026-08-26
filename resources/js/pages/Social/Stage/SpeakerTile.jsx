import { useCallback } from 'react';
import { StageAvatar, roleLabel } from './helpers';
import { IconCrown, IconMicOff } from './StageIcons';

/** Hover/title copy for the per-speaker connection dot. */
const CONN_LABEL = {
    connecting: 'Connecting…',
    connected: 'Connected — verifying audio',
    verified: 'Voice verified',
    failed: 'Connection blocked',
};

/**
 * One speaker on the deck: avatar with an active-speaker ring, host crown, and a
 * mute glyph. When `onSelect` is provided (host viewing someone else) the tile
 * becomes a button that opens that participant's moderation actions.
 *
 * `peerState` (from the active voice driver) adds a small corner dot showing the
 * live connection phase to this speaker — omitted for my own tile.
 *
 * `videoElement` is a raw `<video>` DOM node from the LiveKit driver (camera or
 * screen-share), imperatively mounted here since a live MediaStreamTrack needs a
 * real element to attach to, not something React can render declaratively. When
 * present it fills the tile in place of the avatar ring; falls back to the ring
 * the moment camera/screen goes off (videoElement becomes null again).
 */
export default function SpeakerTile({
    participant,
    speaking = false,
    me = false,
    peerState = null,
    onSelect,
    videoElement = null,
}) {
    const user = participant.user;
    const isHost = participant.role === 'host';
    const muted = Boolean(participant.is_muted);
    const clickable = typeof onSelect === 'function';
    const connPhase = peerState?.phase || null;
    const hasVideo = Boolean(videoElement);

    // Only touch the raw <video> child here — the scrim/crown/name overlay
    // below is real JSX in this same container, so clearing innerHTML would
    // wipe React's own children out from under it.
    const mountVideo = useCallback(
        (node) => {
            if (!node) {
                return;
            }
            const existing = node.querySelector('video');
            if (existing && existing !== videoElement) {
                existing.remove();
            }
            if (videoElement && videoElement.parentNode !== node) {
                videoElement.classList.add('mf-stage-tile__video-el');
                node.insertBefore(videoElement, node.firstChild);
            }
        },
        [videoElement],
    );

    const className = [
        'mf-stage-tile',
        speaking && !muted ? 'is-speaking' : '',
        muted ? 'is-muted' : '',
        isHost ? 'is-host' : '',
        me ? 'is-me' : '',
        clickable ? 'is-clickable' : '',
        hasVideo ? 'has-video' : '',
    ]
        .filter(Boolean)
        .join(' ');

    const inner = (
        <>
            <span className="mf-stage-tile__avatar-wrap">
                {hasVideo ? (
                    <span className="mf-stage-tile__video" ref={mountVideo}>
                        <span className="mf-stage-tile__video-scrim" aria-hidden />
                        {isHost ? (
                            <span className="mf-stage-tile__video-crown" aria-hidden>
                                <IconCrown />
                            </span>
                        ) : null}
                        <span className="mf-stage-tile__video-meta">
                            {muted ? (
                                <span className="mf-stage-tile__video-mic is-muted" aria-hidden>
                                    <IconMicOff />
                                </span>
                            ) : null}
                            <span className="mf-stage-tile__video-name truncate">
                                {user?.name || 'Fan'}
                                {me ? ' (you)' : ''}
                            </span>
                        </span>
                    </span>
                ) : (
                    <>
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
                    </>
                )}
                {connPhase ? (
                    <span
                        className={`mf-stage-tile__conn is-${connPhase}`}
                        title={CONN_LABEL[connPhase] || ''}
                        aria-hidden
                    />
                ) : null}
            </span>
            {hasVideo ? null : (
                <>
                    <span className="mf-stage-tile__name" title={user?.name || 'Fan'}>
                        {user?.name || 'Fan'}
                        {me ? ' (you)' : ''}
                    </span>
                    <span className="mf-stage-tile__role mf-mono">{roleLabel(participant.role)}</span>
                </>
            )}
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
