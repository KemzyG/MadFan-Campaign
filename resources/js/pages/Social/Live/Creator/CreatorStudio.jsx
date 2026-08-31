import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useLiveStageSession } from '../LiveStageSessionContext';
import { useLiveStageMedia } from '../useLiveStageMedia';
import { useLiveStageViewers } from './useLiveStageViewers';
import MirrorPanel from './panels/MirrorPanel';
import StudioSidePanel from './panels/StudioSidePanel';

/**
 * The host's production interface for Creator Live (spec §7-9): a docked
 * console split into the Mirror (camera preview + mic/camera/end controls)
 * and a tabbed side panel covering Messages, Viewers, and Settings. Built on
 * the Kickoff Studio register (dark steel, console/instant motion) already
 * shipped for Stage.
 *
 * Going live is a single step now — LiveStageController::store creates and
 * starts the stage in the same request, so a host reaches this page already
 * live; there's no separate device-check screen to click "Start Live" from.
 * Camera/mic access itself is requested here, once mounted (see
 * useLiveStageMedia) — MirrorPanel surfaces that connection's own
 * connecting/error states directly in the monitor frame.
 */
export default function CreatorStudio() {
    const { stage, comments, postComment, deleteComment, muteViewer, removeViewer, updateSettings } =
        useLiveStageSession();
    const isDraft = stage.status === 'draft';
    const isLive = !isDraft;

    const media = useLiveStageMedia({ stageId: stage.id, isHost: true, isLive });
    const { viewers, loading: viewersLoading } = useLiveStageViewers(stage.id, isLive, stage.viewer_count);

    const [endConfirm, setEndConfirm] = useState(false);
    const [activeTab, setActiveTab] = useState('messages');
    const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

    // Defensive fallback only — every "Go Live" submission already starts
    // the stage server-side, so a host should never actually land here in
    // draft. If one somehow does (a stray pre-existing draft, or a start()
    // that failed mid-request), retry automatically instead of leaving a
    // dead "click to go live" screen.
    useEffect(() => {
        if (!isDraft) {
            return;
        }
        router.post(`/social/live/${stage.id}/start`);
    }, [isDraft, stage.id]);

    // On desktop the side panel is always docked open, so this only matters
    // on mobile — see MobilePanelNav/StudioSidePanel's `mobileOpen` prop.
    const openMobilePanel = (tab) => {
        setActiveTab(tab);
        setMobilePanelOpen(true);
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
            <div className="kf-studio">
                <div className="kf-studio__monitor">
                    <div className="kf-studio__preview-empty">Going live…</div>
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
