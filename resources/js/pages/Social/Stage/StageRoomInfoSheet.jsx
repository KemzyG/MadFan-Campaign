import StageSheet from './StageSheet';
import StageConnectionPanel from './StageConnectionPanel';
import { StageAvatar } from './helpers';
import {
    IconInfo,
    IconInvite,
    IconSettings,
    IconShare,
    IconVoice,
} from './StageIcons';
import { useStageSession } from './StageSessionContext';
import { voiceConnectionLabel } from './stageVoiceConnection';
import { useState } from 'react';

/**
 * "Stage details" sheet — everything the old header showed inline (host/club,
 * room stats, network + voice + connection status) plus quick jumps to the
 * settings/invite/share sheets, now reached from a single header button
 * instead of cluttering the room chrome at all times.
 */
export default function StageRoomInfoSheet({
    open,
    onClose,
    onOpenSettings,
    onOpenShare,
    onOpenInvite,
}) {
    const { room, voiceConnection } = useStageSession();
    const [connOpen, setConnOpen] = useState(false);

    const stage = room?.stage;
    const me = room?.me;

    if (!stage) {
        return null;
    }

    const isLive = stage.status === 'live';
    const isHost = me?.role === 'host';
    const usingReverb = room?.realtime?.mode === 'reverb';
    const voiceEnabled = Boolean(stage.voice_enabled);
    const inviteAllowed = stage.allow_invite !== false;
    const speakerCount = stage.speaker_count ?? 0;
    const inRoom = stage.participant_count ?? 0;
    const listeningCount = stage.listener_count ?? Math.max(0, inRoom - speakerCount);
    const showConnPill = voiceEnabled && isLive;

    const connHeadline = voiceConnection?.headline || 'idle';
    const connState =
        connHeadline === 'verified'
            ? 'verified'
            : connHeadline === 'degraded'
              ? 'degraded'
              : connHeadline === 'idle'
                ? 'idle'
                : 'connecting';

    const jump = (fn) => () => {
        onClose();
        fn?.();
    };

    return (
        <StageSheet
            open={open}
            onClose={onClose}
            labelledBy="stage-room-info-title"
            icon={<IconInfo />}
            title="Stage details"
            className="mf-stage-room-info-sheet"
        >
            <div className="mf-stage-room-info">
                <div className="mf-stage-room-info__host">
                    <StageAvatar user={stage.host} size="md" />
                    <div className="min-w-0">
                        <p className="mf-stage-room-info__host-name truncate">{stage.host?.name || 'Fan'}</p>
                        <p className="mf-stage-room-info__host-meta truncate">
                            Host{stage.club?.name ? ` · ${stage.club.name}` : ''}
                        </p>
                    </div>
                </div>

                <div className="mf-stage-room-info__stats">
                    <span className="mf-stageroom__stat">
                        <span className="mf-stageroom__stat-value mf-mono">{speakerCount}</span>
                        <span className="mf-stageroom__stat-label">on stage</span>
                    </span>
                    <span className="mf-stageroom__stat">
                        <span className="mf-stageroom__stat-value mf-mono">{listeningCount}</span>
                        <span className="mf-stageroom__stat-label">listening</span>
                    </span>
                </div>

                <div className="mf-stage-room-info__chips">
                    <span
                        className={`mf-stage-conn-chip mf-mono ${usingReverb ? 'is-live' : 'is-poll'}`}
                        title={usingReverb ? 'Realtime updates' : 'Polling updates'}
                    >
                        {usingReverb ? 'Realtime' : 'Polling'}
                    </span>
                    {voiceEnabled ? (
                        <span className={`mf-stage-voice-chip mf-mono ${!isLive ? 'mf-stage-voice-chip--off' : ''}`.trim()}>
                            Voice on
                        </span>
                    ) : (
                        <span className="mf-stage-voice-chip mf-stage-voice-chip--off mf-mono">Text lobby</span>
                    )}
                    {showConnPill ? (
                        <span className="mf-stage-conn-pill-wrap">
                            <button
                                type="button"
                                className={`mf-stage-conn-chip mf-stage-conn-pill mf-mono is-${connState}`}
                                aria-expanded={connOpen}
                                aria-haspopup="dialog"
                                title="Voice connection details"
                                onClick={() => setConnOpen((v) => !v)}
                            >
                                <IconVoice />
                                {voiceConnectionLabel(voiceConnection)}
                            </button>
                            {connOpen ? <StageConnectionPanel onClose={() => setConnOpen(false)} /> : null}
                        </span>
                    ) : null}
                </div>

                <div className="mf-stage-room-info__actions">
                    {isHost && isLive ? (
                        <button type="button" className="mf-stage-room-info__action" onClick={jump(onOpenSettings)}>
                            <IconSettings />
                            Stage settings
                        </button>
                    ) : null}
                    {isLive && me && inviteAllowed ? (
                        <button type="button" className="mf-stage-room-info__action" onClick={jump(onOpenInvite)}>
                            <IconInvite />
                            Invite people
                        </button>
                    ) : null}
                    {isLive && me && inviteAllowed ? (
                        <button type="button" className="mf-stage-room-info__action" onClick={jump(onOpenShare)}>
                            <IconShare />
                            Share stage
                        </button>
                    ) : null}
                </div>
            </div>
        </StageSheet>
    );
}
