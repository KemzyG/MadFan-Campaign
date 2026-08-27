import { useEffect, useRef, useState } from 'react';
import StageAudioMenu from './StageAudioMenu';
import {
    IconCamera,
    IconCameraOff,
    IconClose,
    IconHand,
    IconMic,
    IconMicOff,
    IconScreenShare,
    IconUploadVideo,
    IconVoice,
    IconVolume,
    StageIconButton,
} from './StageIcons';
import { useStageActions } from './useStageActions';

/**
 * The room's footer control row. Pared back to the voice-critical, one-tap
 * controls — audio output, start-voice / enable-mic / mute, and raise hand.
 * Reactions moved to the floating FAB; chat, settings, share and End/Leave live
 * in the top segment / header. Every action is optimistic (see useStageActions).
 */
export default function StageControlBar() {
    const actions = useStageActions();
    const [audioMenu, setAudioMenu] = useState(false);
    const audioRef = useRef(null);
    const presentFileRef = useRef(null);

    function onPresentFileChosen(event) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (file) {
            actions.startPresentation(file);
        }
    }

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
        <div className="mf-stage-control-bar" role="toolbar" aria-label="Stage controls">
            <div className="mf-stage-control-bar__group">
                <div className="mf-stage-popover-anchor" ref={audioRef}>
                    <StageIconButton
                        label="Audio output"
                        active={audioMenu}
                        aria-haspopup="dialog"
                        aria-expanded={audioMenu}
                        onClick={() => setAudioMenu((open) => !open)}
                    >
                        <IconVolume />
                    </StageIconButton>
                    {audioMenu ? (
                        <div className="mf-stage-popover mf-stage-popover--audio">
                            <StageAudioMenu />
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="mf-stage-control-bar__group mf-stage-control-bar__group--primary">
                {actions.canStartVoice ? (
                    <StageIconButton label="Start voice" pitch onClick={actions.startVoice}>
                        <IconVoice />
                    </StageIconButton>
                ) : null}

                {actions.micNeedsRecovery ? (
                    <StageIconButton label="Enable microphone" pitch onClick={actions.enableMic}>
                        <IconMic />
                    </StageIconButton>
                ) : null}

                {actions.canMute ? (
                    <StageIconButton
                        label={actions.me.is_muted ? 'Unmute microphone' : 'Mute microphone'}
                        active={!actions.me.is_muted}
                        pitch={!actions.me.is_muted}
                        onClick={actions.toggleMute}
                    >
                        {actions.me.is_muted ? <IconMicOff /> : <IconMic />}
                    </StageIconButton>
                ) : null}

                {actions.canRaiseHand ? (
                    <StageIconButton
                        label={actions.handRaised ? 'Hand raised' : 'Request to speak'}
                        active={actions.handRaised}
                        disabled={actions.handRaised}
                        onClick={actions.raiseHand}
                    >
                        <IconHand />
                    </StageIconButton>
                ) : null}
            </div>

            {actions.canPublishVideo ? (
                <div className="mf-stage-control-bar__group mf-stage-control-bar__group--media" aria-label="Camera and screen share">
                    <span className="mf-stage-control-bar__divider" aria-hidden />
                    <StageIconButton
                        label={actions.cameraOn ? 'Turn camera off' : 'Turn camera on'}
                        active={actions.cameraOn}
                        pitch={actions.cameraOn}
                        onClick={actions.toggleCamera}
                    >
                        {actions.cameraOn ? <IconCamera /> : <IconCameraOff />}
                    </StageIconButton>

                    <StageIconButton
                        label={actions.screenShareOn ? 'Stop sharing screen' : 'Share screen'}
                        active={actions.screenShareOn}
                        pitch={actions.screenShareOn}
                        onClick={actions.toggleScreenShare}
                    >
                        <IconScreenShare />
                    </StageIconButton>

                    {actions.canPresent ? (
                        <>
                            <input
                                ref={presentFileRef}
                                type="file"
                                accept="video/*"
                                className="sr-only"
                                tabIndex={-1}
                                onChange={onPresentFileChosen}
                            />
                            <StageIconButton
                                label={actions.presenting ? 'Stop presenting' : 'Present a video'}
                                active={actions.presenting}
                                pitch={actions.presenting}
                                onClick={() =>
                                    actions.presenting
                                        ? actions.stopPresentation()
                                        : presentFileRef.current?.click()
                                }
                            >
                                {actions.presenting ? <IconClose /> : <IconUploadVideo />}
                            </StageIconButton>
                        </>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
