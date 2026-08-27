import { useCallback, useEffect, useState } from 'react';
import { IconClose } from './StageIcons';
import { useStageSession } from './StageSessionContext';

/**
 * Floating self-monitor: always shows exactly what you're currently sending —
 * camera or screen share — so you can confirm what other people actually see,
 * no matter which room tab (Stage/Chat/People) you're on. Mounted at the room
 * root (not inside the tab-switched `.mf-stageroom__main`) so it survives
 * every view. Screen share wins the bubble over camera when both are on,
 * matching how the deck/hero tiles already prioritise it.
 *
 * The video sits on a transparent surface — no filler box behind it, only the
 * live feed itself plus a thin ring — since this is a monitor of the raw
 * output, not a tile that needs a placeholder colour while waiting to connect.
 */
export default function StageSelfPreview() {
    const { room, videoTracks } = useStageSession();
    const [dismissed, setDismissed] = useState(false);
    const me = room?.me;
    const meId = me ? Number(me.user_id) : null;

    const screenEl = meId != null ? videoTracks.get(`${meId}:screen_share`) : null;
    const cameraEl = meId != null ? videoTracks.get(`${meId}:camera`) : null;
    const activeEl = screenEl || cameraEl;
    const sourceLabel = screenEl ? 'Screen' : cameraEl ? 'Camera' : null;

    // A newly (re)started source should reappear even if a previous one was
    // dismissed — dismissing only hides the bubble for the source you closed.
    useEffect(() => {
        setDismissed(false);
    }, [sourceLabel]);

    const mount = useCallback(
        (node) => {
            if (!node || !activeEl) {
                return;
            }
            const existing = node.querySelector('video');
            if (existing && existing !== activeEl) {
                existing.remove();
            }
            if (activeEl.parentNode !== node) {
                activeEl.classList.add('mf-stage-self-preview__video-el');
                node.appendChild(activeEl);
            }
        },
        [activeEl],
    );

    if (!activeEl || dismissed) {
        return null;
    }

    return (
        <div
            className="mf-stage-self-preview"
            role="status"
            aria-label={`You're sharing your ${sourceLabel.toLowerCase()}`}
        >
            <span className="mf-stage-self-preview__frame">
                <span className="mf-stage-self-preview__video" ref={mount} />
                <button
                    type="button"
                    className="mf-stage-self-preview__close"
                    aria-label="Hide preview"
                    onClick={() => setDismissed(true)}
                >
                    <IconClose />
                </button>
            </span>
            <span className="mf-stage-self-preview__label mf-mono">You · {sourceLabel}</span>
        </div>
    );
}
