import { useEffect, useRef, useState } from 'react';
import StageAudioMenu from './StageAudioMenu';
import { IconMic, IconMicOff, IconVolume } from './StageIcons';
import { useStageActions } from './useStageActions';

/**
 * The Reels viewer's control set as standalone floating buttons instead of a
 * docked bar (see the shared `.mf-stage-fab-stack` wrapper in Show.jsx,
 * alongside the reaction button). Audio output is everyone's; mute/unmute
 * only appears once the host has actually promoted this viewer to speaker
 * (`onStage`) — a plain listener has no mic to control, so they only ever
 * see the one button. Raise-hand ("request to speak") isn't in this FAB
 * list at all — that request runs through the People panel, not a floating
 * control here. Camera/screen-share/present stay on the docked
 * StageControlBar used by the host's Studio console.
 */
export default function StageViewerFabs() {
    const actions = useStageActions();
    const [audioMenu, setAudioMenu] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        if (!audioMenu) {
            return undefined;
        }

        function onPointer(event) {
            if (audioRef.current && !audioRef.current.contains(event.target)) {
                setAudioMenu(false);
            }
        }
        function onKey(event) {
            if (event.key === 'Escape') {
                setAudioMenu(false);
            }
        }

        document.addEventListener('pointerdown', onPointer);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('pointerdown', onPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [audioMenu]);

    if (!actions.stage) {
        return null;
    }

    return (
        <>
            {actions.canMute ? (
                <button
                    type="button"
                    className={`mf-stage-fab-stack__btn ${actions.me.is_muted ? '' : 'is-active'}`.trim()}
                    aria-label={actions.me.is_muted ? 'Unmute microphone' : 'Mute microphone'}
                    title={actions.me.is_muted ? 'Unmute microphone' : 'Mute microphone'}
                    onClick={actions.toggleMute}
                >
                    {actions.me.is_muted ? <IconMicOff /> : <IconMic />}
                </button>
            ) : null}

            <div className="mf-stage-popover-anchor" ref={audioRef}>
                <button
                    type="button"
                    className={`mf-stage-fab-stack__btn ${audioMenu ? 'is-active' : ''}`.trim()}
                    aria-label="Audio output"
                    title="Audio output"
                    aria-haspopup="dialog"
                    aria-expanded={audioMenu}
                    onClick={() => setAudioMenu((open) => !open)}
                >
                    <IconVolume />
                </button>
                {audioMenu ? (
                    <div className="mf-stage-popover mf-stage-popover--audio">
                        <StageAudioMenu />
                    </div>
                ) : null}
            </div>
        </>
    );
}
