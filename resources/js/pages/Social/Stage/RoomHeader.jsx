import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { formatLiveDuration, StageAvatar } from './helpers';
import StageConnectionPanel from './StageConnectionPanel';
import { IconBack, IconEnd, IconLeave, IconSettings, IconShare, IconVoice, StageIconButton } from './StageIcons';
import { useStageActions } from './useStageActions';
import { useStageSession } from './StageSessionContext';
import { voiceConnectionLabel } from './stageVoiceConnection';

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
 * Top band of the room: back link, live pulse + running duration, connection
 * chip, title, host/club, size stats, and (desktop) settings/share buttons.
 */
export default function RoomHeader({ onOpenSettings, onOpenShare, backHref = '/social/stage' }) {
    const { room, voiceStatus, voiceConnection } = useStageSession();
    const actions = useStageActions();

    const stage = room?.stage;
    const me = room?.me;
    const isLive = stage?.status === 'live';
    const now = useNowTick(isLive && Boolean(stage?.started_at));
    const [connOpen, setConnOpen] = useState(false);

    if (!stage) {
        return null;
    }

    const speakerCount = stage.speaker_count ?? 0;
    const inRoom = stage.participant_count ?? 0;
    const listeningCount = stage.listener_count ?? Math.max(0, inRoom - speakerCount);
    const isHost = me?.role === 'host';
    const usingReverb = room?.realtime?.mode === 'reverb';
    const voiceEnabled = Boolean(stage.voice_enabled);
    const inviteAllowed = stage.allow_invite !== false;

    const voiceChip = !voiceEnabled
        ? 'Text lobby'
        : voiceStatus && voiceStatus !== 'Idle'
          ? voiceStatus
          : 'Voice on';

    const connHeadline = voiceConnection?.headline || 'idle';
    const connState =
        connHeadline === 'verified'
            ? 'verified'
            : connHeadline === 'degraded'
              ? 'degraded'
              : connHeadline === 'idle'
                ? 'idle'
                : 'connecting';
    const showConnPill = voiceEnabled && isLive;

    const confirmEnd = () => {
        if (window.confirm('End this Stage for everyone? This cannot be undone.')) {
            actions.endStage();
        }
    };

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
                        <span
                            className={`mf-stage-conn-chip mf-stageroom__net-chip mf-mono ${usingReverb ? 'is-live' : 'is-poll'}`}
                            title={usingReverb ? 'Realtime updates' : 'Polling updates'}
                        >
                            {usingReverb ? 'Realtime' : 'Polling'}
                        </span>
                        {showConnPill ? (
                            <span className="mf-stage-conn-pill-wrap">
                                <button
                                    type="button"
                                    className={`mf-stage-conn-chip mf-stage-conn-pill mf-mono is-${connState}`}
                                    aria-expanded={connOpen}
                                    aria-haspopup="dialog"
                                    title="Voice connection details"
                                    onClick={() => setConnOpen((open) => !open)}
                                >
                                    <IconVoice />
                                    {voiceConnectionLabel(voiceConnection)}
                                </button>
                                {connOpen ? (
                                    <StageConnectionPanel onClose={() => setConnOpen(false)} />
                                ) : null}
                            </span>
                        ) : null}
                    </div>

                    <h1 className="mf-stageroom__title" title={stage.title}>
                        {stage.title}
                    </h1>

                    <div className="mf-stageroom__host">
                        <StageAvatar user={stage.host} size="sm" />
                        <p className="mf-stageroom__host-copy min-w-0 truncate">
                            <span className="mf-stageroom__host-role">Host</span>
                            {stage.host?.name || 'Fan'}
                            {stage.club?.name ? (
                                <span className="mf-stageroom__club"> · {stage.club.name}</span>
                            ) : null}                        </p>
                    </div>
                </div>
            </div>

            <div className="mf-stageroom__header-side">
                <div className="mf-stageroom__stats" aria-label="Room size">
                    <span className="mf-stageroom__stat">
                        <span className="mf-stageroom__stat-value mf-mono">{speakerCount}</span>
                        <span className="mf-stageroom__stat-label">on stage</span>
                    </span>
                    <span className="mf-stageroom__stat">
                        <span className="mf-stageroom__stat-value mf-mono">{listeningCount}</span>
                        <span className="mf-stageroom__stat-label">listening</span>
                    </span>
                </div>

                <span
                    className={`mf-stage-voice-chip mf-stageroom__side-voice mf-mono ${!voiceEnabled || !isLive ? 'mf-stage-voice-chip--off' : ''}`.trim()}
                >
                    {voiceChip}
                </span>

                <div className="mf-stageroom__header-actions">
                    {isHost && isLive ? (
                        <button
                            type="button"
                            className="mf-stage-icon-btn"
                            aria-label="Stage settings"
                            title="Stage settings"
                            onClick={onOpenSettings}
                        >
                            <IconSettings />
                        </button>
                    ) : null}
                    {isLive && me && inviteAllowed ? (
                        <button
                            type="button"
                            className="mf-stage-icon-btn mf-stageroom__share-btn"
                            aria-label="Share stage"
                            title="Share stage"
                            onClick={onOpenShare}
                        >
                            <IconShare />
                        </button>
                    ) : null}
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
            </div>
        </header>
    );
}
