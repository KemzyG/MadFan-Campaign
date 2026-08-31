import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { formatLiveDuration, StageAvatar } from './helpers';
import StageRoomInfoSheet from './StageRoomInfoSheet';
import { IconBack, IconEnd, IconEye, IconHeart, IconInfo, IconLeave, StageIconButton } from './StageIcons';
import { useStageActions } from './useStageActions';
import { useStageSession } from './StageSessionContext';

/** Re-render once a second while `active` so the on-air timer ticks. */
function useNowTick(active) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!active) {
            return undefined;
        }
        const id = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(id);
    }, [active]);

    return now;
}

/**
 * Minimal top band of the room: back link, live pulse + timer, title, an
 * info button that opens the full "Stage details" sheet (host/club, stats,
 * network + voice + connection status, settings/invite/share), and the
 * primary end/leave action.
 */
export default function RoomHeader({
    onOpenSettings,
    onOpenShare,
    onOpenInvite,
    backHref = '/social/stage',
}) {
    const { room } = useStageSession();
    const actions = useStageActions();

    const stage = room?.stage;
    const isLive = stage?.status === 'live';
    const now = useNowTick(isLive && Boolean(stage?.started_at));
    const [infoOpen, setInfoOpen] = useState(false);

    if (!stage) {
        return null;
    }

    const confirmEnd = () => {
        if (window.confirm('End this Stage for everyone? This cannot be undone.')) {
            actions.endStage();
        }
    };

    // A viewer's Reels screen (Video/Streaming, not hosting) reads as a
    // broadcast: who's live + how many are watching/reacting, not the
    // host's production controls (info sheet, end-stage). Voice rooms and
    // the host's own Studio keep the classic header below unchanged.
    const isReelsViewer = !actions.isHost && stage.type !== 'voice';

    if (isReelsViewer) {
        return (
            <header className="mf-stageroom__header mf-stageroom__header--viewer">
                <Link
                    href={backHref}
                    className="mf-stageroom__header-lead min-w-0"
                    aria-label="Back to lobby"
                >
                    <StageAvatar user={stage.host} size="xs" className="mf-stageroom__host-avatar" />

                    <div className="mf-stageroom__identity mf-stageroom__identity--viewer min-w-0">
                        <h1 className="mf-stageroom__title mf-stageroom__title--compact" title={stage.title}>
                            {stage.title}
                        </h1>
                        {isLive ? (
                            <span className="mf-stage-live-chip mf-stage-live-chip--pulse mf-mono">
                                <span className="mf-stage-live-dot" aria-hidden />
                                Live
                            </span>
                        ) : (
                            <span className="mf-stage-voice-chip mf-stage-voice-chip--off mf-mono">Ended</span>
                        )}
                    </div>
                </Link>

                <div className="mf-stageroom__header-actions">
                    <span className="mf-stageroom__header-stat mf-mono" aria-label={`${stage.listener_count ?? 0} watching`}>
                        <IconEye />
                        {stage.listener_count ?? 0}
                    </span>
                    <span className="mf-stageroom__header-stat mf-mono" aria-label={`${stage.reaction_count ?? 0} likes`}>
                        <IconHeart />
                        {stage.reaction_count ?? 0}
                    </span>
                </div>
            </header>
        );
    }

    return (
        <header className="mf-stageroom__header">
            <div className="mf-stageroom__header-lead min-w-0">
                <Link
                    href={backHref}
                    className="mf-stage-icon-btn mf-stageroom__back"
                    aria-label="Back to lobby"
                    title="Back to lobby"
                >
                    <IconBack />
                </Link>

                <div className="mf-stageroom__identity min-w-0">
                    <div className="mf-stageroom__badges">
                        {isLive ? (
                            <span className="mf-stage-live-chip mf-stage-live-chip--pulse mf-mono">
                                <span className="mf-stage-live-dot" aria-hidden />
                                Live
                            </span>
                        ) : (
                            <span className="mf-stage-voice-chip mf-stage-voice-chip--off mf-mono">Ended</span>
                        )}
                        {isLive && stage.started_at ? (
                            <span className="mf-stageroom__timer mf-mono" aria-label="Time on air">
                                {formatLiveDuration(stage.started_at, now)}
                            </span>
                        ) : null}
                        {isLive ? (
                            <span
                                className="mf-stageroom__viewers mf-mono"
                                aria-label={`${stage.listener_count ?? 0} listening`}
                            >
                                <IconEye />
                                {stage.listener_count ?? 0}
                            </span>
                        ) : null}
                    </div>

                    <h1 className="mf-stageroom__title" title={stage.title}>
                        {stage.title}
                    </h1>
                </div>
            </div>

            <div className="mf-stageroom__header-actions">
                <button
                    type="button"
                    className="mf-stage-icon-btn"
                    aria-label="Stage details"
                    title="Stage details"
                    onClick={() => setInfoOpen(true)}
                >
                    <IconInfo />
                </button>
                {actions.canEnd ? (
                    <StageIconButton label="End stage for everyone" danger onClick={confirmEnd}>
                        <IconEnd />
                    </StageIconButton>
                ) : actions.canLeave ? (
                    <StageIconButton label="Leave stage" onClick={actions.leave}>
                        <IconLeave />
                    </StageIconButton>
                ) : null}
            </div>

            <StageRoomInfoSheet
                open={infoOpen}
                onClose={() => setInfoOpen(false)}
                onOpenSettings={onOpenSettings}
                onOpenShare={onOpenShare}
                onOpenInvite={onOpenInvite}
            />
        </header>
    );
}
