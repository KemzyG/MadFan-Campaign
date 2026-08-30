import { router } from '@inertiajs/react';
import { useState } from 'react';
import VideoMount from '../components/VideoMount';
import { useDevicePreview } from '../useDevicePreview';
import { useLiveStageSession } from '../LiveStageSessionContext';
import { useLiveStageMedia } from '../useLiveStageMedia';
import { useLiveStageViewers } from './useLiveStageViewers';
import MirrorPanel from './panels/MirrorPanel';
import StudioSidePanel from './panels/StudioSidePanel';

/**
 * The host's production interface for Creator Live (spec §7-9): a pre-live
 * device-check studio, then — once live — a docked console split into the
 * Mirror (camera preview + mic/camera/end controls) and a tabbed side panel
 * covering Messages, Viewers, and Settings. Built on the Kickoff Studio
 * register (dark steel, console/instant motion) already shipped for Stage.
 */
export default function CreatorStudio() {
    const { stage, comments, postComment, deleteComment, muteViewer, removeViewer, updateSettings } =
        useLiveStageSession();
    const isDraft = stage.status === 'draft';
    const isLive = !isDraft;

    const preview = useDevicePreview(isDraft);
    const media = useLiveStageMedia({ stageId: stage.id, isHost: true, isLive });
    const { viewers, loading: viewersLoading } = useLiveStageViewers(stage.id, isLive, stage.viewer_count);

    const [starting, setStarting] = useState(false);
    const [endConfirm, setEndConfirm] = useState(false);
    const [activeTab, setActiveTab] = useState('messages');
    const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

    // On desktop the side panel is always docked open, so this only matters
    // on mobile — see MobilePanelNav/StudioSidePanel's `mobileOpen` prop.
    const openMobilePanel = (tab) => {
        setActiveTab(tab);
        setMobilePanelOpen(true);
    };

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

    const handleMuteViewer = (userId, muted = true) => userId && muteViewer(userId, muted);
    const handleRemoveViewer = (userId, ban = false) => userId && removeViewer(userId, ban);

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
            <MirrorPanel
                stage={stage}
                media={media}
                endConfirm={endConfirm}
                onEndStream={endStream}
                commentCount={comments.length}
                onOpenPanel={openMobilePanel}
            />

            <StudioSidePanel
                stage={stage}
                comments={comments}
                onPostComment={postComment}
                onDeleteComment={deleteComment}
                onMuteViewer={handleMuteViewer}
                onRemoveViewer={handleRemoveViewer}
                viewers={viewers}
                viewersLoading={viewersLoading}
                onUpdateSettings={updateSettings}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                mobileOpen={mobilePanelOpen}
                onMobileClose={() => setMobilePanelOpen(false)}
            />
        </div>
    );
}
