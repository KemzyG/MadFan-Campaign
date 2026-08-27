import { router } from '@inertiajs/react';
import { useState } from 'react';
import CommentComposer from '../components/CommentComposer';
import CommentsFeed from '../components/CommentsFeed';
import LiveBadge from '../components/LiveBadge';
import ViewerCountBadge from '../components/ViewerCountBadge';
import VideoMount from '../components/VideoMount';
import { useDevicePreview } from '../useDevicePreview';
import { useLiveStageSession } from '../LiveStageSessionContext';
import { useLiveStageMedia } from '../useLiveStageMedia';
import { IconCamera, IconCameraOff, IconMic, IconMicOff } from '../../Stage/StageIcons';

/**
 * The host's production interface for Creator Live (spec §7-9): a pre-live
 * device-check studio, then — once live — a docked console around the
 * camera preview with viewer count, comments (with inline moderation), and
 * the End Live control. Built on the Kickoff Studio register (dark steel,
 * console/instant motion) already shipped for Stage.
 */
export default function CreatorStudio() {
    const { stage, comments, postComment, deleteComment, muteViewer, removeViewer } = useLiveStageSession();
    const isDraft = stage.status === 'draft';

    const preview = useDevicePreview(isDraft);
    const media = useLiveStageMedia({ stageId: stage.id, isHost: true, isLive: !isDraft });

    const [starting, setStarting] = useState(false);
    const [endConfirm, setEndConfirm] = useState(false);

    const goLive = () => {
        setStarting(true);
        router.post(`/social/live/${stage.id}/start`, {}, { onFinish: () => setStarting(false) });
    };

    const endStream = () => {
        if (!endConfirm) {
            setEndConfirm(true);
            return;
        }
        router.post(`/social/live/${stage.id}/end`);
    };

    if (isDraft) {
        return (
            <div className="kf-studio kf-studio--setup">
                <div className="kf-studio__preview-frame kf-viewfinder">
                    {preview.videoEl ? (
                        <VideoMount videoEl={preview.videoEl} className="kf-studio__preview-video" mirrored />
                    ) : (
                        <div className="kf-studio__preview-empty">
                            {preview.error ? preview.error : 'Requesting camera access…'}
                        </div>
                    )}
                    <span className="kf-viewfinder__tl" />
                    <span className="kf-viewfinder__tr" />
                    <span className="kf-viewfinder__bl" />
                    <span className="kf-viewfinder__br" />
                </div>

                <div className="kf-studio__setup-panel">
                    <h1 className="kf-studio__setup-title">{stage.title}</h1>
                    <p className="kf-studio__setup-hint">
                        Check your camera and mic, then go live. Viewers can join the moment you do.
                    </p>
                    <button
                        type="button"
                        className="kf-form__btn kf-form__btn--primary kf-studio__go-live"
                        onClick={goLive}
                        disabled={starting || !preview.videoEl}
                    >
                        {starting ? 'Going live…' : 'Start Live'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="kf-studio">
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
                        onClick={endStream}
                    >
                        {endConfirm ? 'Confirm end?' : 'End Live'}
                    </button>
                </div>
            </div>

            <aside className="kf-studio__side">
                <h2 className="kf-studio__side-title">Comments</h2>
                <CommentsFeed
                    comments={comments}
                    canModerate
                    onDelete={deleteComment}
                    onMuteUser={(userId) => userId && muteViewer(userId, true)}
                    onRemoveUser={(userId) => userId && removeViewer(userId, false)}
                />
                <CommentComposer
                    onSubmit={postComment}
                    disabled={!stage.settings.allow_comments}
                    maxLength={stage.max_comment_length}
                    placeholder="Reply as host…"
                />
            </aside>
        </div>
    );
}
