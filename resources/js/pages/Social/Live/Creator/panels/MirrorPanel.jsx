import LiveBadge from '../../components/LiveBadge';
import ViewerCountBadge from '../../components/ViewerCountBadge';
import VideoMount from '../../components/VideoMount';
import { IconCamera, IconCameraOff, IconMic, IconMicOff } from '../../../Stage/StageIcons';
import MobilePanelNav from './MobilePanelNav';

/**
 * The host's own camera monitor ("mirror") plus the mic/camera/end-stream
 * controls docked under it. Kept separate from the tabbed side panels below
 * (Viewers/Messages/Settings) since it's always visible, never switched away
 * from — it's the one thing a host is always looking at while live.
 *
 * On mobile, where the side panel has nowhere to dock, MobilePanelNav below
 * the controls is what opens it as a bottom-sheet overlay instead.
 */
export default function MirrorPanel({ stage, media, endConfirm, onEndStream, commentCount, onOpenPanel }) {
    return (
        <div className="kf-studio__main">
            <div className="kf-studio__monitor kf-viewfinder kf-viewfinder--live">
                {media.localVideoEl ? (
                    <VideoMount videoEl={media.localVideoEl} className="kf-studio__monitor-video" mirrored />
                ) : (
                    <div className="kf-studio__preview-empty">
                        {media.mediaState === 'error' ? media.mediaError : 'Connecting…'}
                    </div>
                )}
                <span className="kf-viewfinder__tl" />
                <span className="kf-viewfinder__tr" />
                <span className="kf-viewfinder__bl" />
                <span className="kf-viewfinder__br" />

                <div className="kf-studio__monitor-overlay">
                    <LiveBadge />
                    <ViewerCountBadge count={stage.viewer_count} />
                </div>
            </div>

            <div className="kf-studio__controls">
                <button
                    type="button"
                    className={`kf-studio__control-btn ${media.micOn ? 'is-live' : ''}`}
                    onClick={media.toggleMic}
                    aria-pressed={media.micOn}
                >
                    {media.micOn ? <IconMic /> : <IconMicOff />}
                    Mic
                </button>
                <button
                    type="button"
                    className={`kf-studio__control-btn ${media.cameraOn ? 'is-live' : ''}`}
                    onClick={media.toggleCamera}
                    aria-pressed={media.cameraOn}
                >
                    {media.cameraOn ? <IconCamera /> : <IconCameraOff />}
                    Camera
                </button>
                <button
                    type="button"
                    className="kf-studio__control-btn kf-studio__control-btn--danger"
                    onClick={onEndStream}
                >
                    {endConfirm ? 'Confirm end?' : 'End Live'}
                </button>
            </div>

            <MobilePanelNav commentCount={commentCount} viewerCount={stage.viewer_count} onOpen={onOpenPanel} />
        </div>
    );
}
