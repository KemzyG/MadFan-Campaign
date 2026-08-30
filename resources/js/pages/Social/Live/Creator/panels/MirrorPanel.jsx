import LiveBadge from '../../components/LiveBadge';
import LikesCountBadge from '../../components/LikesCountBadge';
import ViewerCountBadge from '../../components/ViewerCountBadge';
import VideoMount from '../../components/VideoMount';
import { IconCamera, IconMic, IconMicOff } from '../../../Stage/StageIcons';
import MobilePanelNav from './MobilePanelNav';

/**
 * The host's own camera monitor ("mirror") — full-bleed, edge to edge, with
 * every control floating over the video as a transparent overlay rather than
 * boxed beside it. There's no "camera off but still live" state for a
 * Creator broadcast, so the camera FAB doubles as the live indicator (red,
 * pulses once armed) and the end-live control — tap it once to arm, again to
 * confirm, replacing a separate "End Live" button. Mic stays an independent
 * on/off toggle at the opposite side.
 */
export default function MirrorPanel({ stage, media, endConfirm, onEndStream, commentCount, onOpenPanel }) {
    return (
        <div className="kf-studio__main">
            <div className="kf-studio__monitor">
                {media.localVideoEl ? (
                    <VideoMount videoEl={media.localVideoEl} className="kf-studio__monitor-video" mirrored />
                ) : (
                    <div className="kf-studio__preview-empty">
                        {media.mediaState === 'error' ? media.mediaError : 'Connecting…'}
                    </div>
                )}

                <div className="kf-studio__monitor-overlay">
                    <LiveBadge />
                </div>

                <div className="kf-studio__monitor-overlay kf-studio__monitor-overlay--right">
                    <ViewerCountBadge count={stage.viewer_count} />
                    <LikesCountBadge count={stage.reaction_count} />
                </div>

                <button
                    type="button"
                    className={`kf-studio__fab kf-studio__fab--mic ${media.micOn ? 'is-live' : ''}`}
                    onClick={media.toggleMic}
                    aria-pressed={media.micOn}
                    aria-label={media.micOn ? 'Mute microphone' : 'Unmute microphone'}
                >
                    {media.micOn ? <IconMic /> : <IconMicOff />}
                </button>

                <button
                    type="button"
                    className={`kf-studio__fab kf-studio__fab--camera ${endConfirm ? 'is-confirm' : ''}`}
                    onClick={onEndStream}
                    aria-label={endConfirm ? 'Tap again to end the live stream' : 'End live stream'}
                >
                    <IconCamera />
                </button>

                <MobilePanelNav commentCount={commentCount} viewerCount={stage.viewer_count} onOpen={onOpenPanel} />
            </div>
        </div>
    );
}
