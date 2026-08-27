import { IconCamera, IconCameraOff, IconMic, IconMicOff, IconScreenShare } from './StageIcons';
import { useStageActions } from './useStageActions';

/**
 * OBS-style "Sources" strip: a compact, glanceable readout of what you're
 * actually sending — mic always (every stage type carries audio), camera and
 * screen only where the stage type allows video (see
 * StageVoice::publishSourcesFor). Chips call the exact same actions the
 * control bar buttons do — this is a second entry point onto the same state,
 * not a parallel one — and only render for the host/speaker whose sources
 * these are; a listener has nothing to show here.
 */
export default function StageSourcesBar() {
    const actions = useStageActions();

    if (!actions.stage || !actions.onStage) {
        return null;
    }

    const micOn = actions.canMute && !actions.me?.is_muted;
    const showVideo = actions.stage.type !== 'voice' && actions.canPublishVideo;

    return (
        <div className="mf-stage-sources" role="group" aria-label="Your sources">
            <span className="mf-stage-sources__label mf-mono">Sources</span>
            <div className="mf-stage-sources__row">
                <button
                    type="button"
                    className={`mf-stage-sources__chip ${micOn ? 'is-live' : ''}`}
                    disabled={!actions.canMute}
                    onClick={actions.canMute ? actions.toggleMute : undefined}
                >
                    <span className="mf-stage-sources__dot" aria-hidden />
                    {micOn ? <IconMic /> : <IconMicOff />}
                    Mic
                </button>

                {showVideo ? (
                    <button
                        type="button"
                        className={`mf-stage-sources__chip ${actions.cameraOn ? 'is-live' : ''}`}
                        onClick={actions.toggleCamera}
                    >
                        <span className="mf-stage-sources__dot" aria-hidden />
                        {actions.cameraOn ? <IconCamera /> : <IconCameraOff />}
                        Camera
                    </button>
                ) : null}

                {showVideo ? (
                    <button
                        type="button"
                        className={`mf-stage-sources__chip ${actions.screenShareOn ? 'is-live' : ''}`}
                        onClick={actions.toggleScreenShare}
                    >
                        <span className="mf-stage-sources__dot" aria-hidden />
                        <IconScreenShare />
                        Screen
                    </button>
                ) : null}
            </div>
        </div>
    );
}
