import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';
import { useSocialFlash, withRollbackFlash } from '../optimistic';
import { isMicBlockedStatus } from './stageMicPermission';
import StageHostPanel from './StageHostPanel';
import {
    IconChat,
    IconEnd,
    IconHand,
    IconHost,
    IconLeave,
    IconMic,
    IconMicOff,
    IconMinimize,
    IconShare,
    IconVoice,
    StageIconButton,
} from './StageIcons';
import { useStageSession } from './StageSessionContext';

function Avatar({ user, size = 'md' }) {
    const cls = size === 'lg' ? 'h-14 w-14' : size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
    const { app } = usePage().props;
    const fallbackUrl = resolveDefaultImageUrl({ app });

    if (user?.avatar_url) {
        return (
            <img
                src={user.avatar_url}
                alt=""
                className={`mf-avatar ${cls}`}
                onError={(event) => onImageError(event, fallbackUrl)}
            />
        );
    }
    const label = (user?.handle || user?.name || '?').slice(0, 2).toUpperCase();
    return (
        <span className={`mf-avatar mf-text-meta ${cls}`} aria-hidden>
            {user?.avatar_emoji || label}
        </span>
    );
}

function StagePerson({ participant }) {
    const user = participant.user;
    const roleLabel = participant.role === 'host' ? 'Host' : 'Speaker';

    return (
        <div
            className={`mf-stage-person ${participant.is_muted ? 'is-muted' : 'is-live'} ${
                participant.role === 'host' ? 'is-host' : ''
            }`}
        >
            <div className="mf-stage-person__ring">
                <Avatar user={user} size="lg" />
            </div>
            <p className="mf-stage-person__name">{user?.name || 'Fan'}</p>
            <p className="mf-mono mf-text-micro text-[var(--mf-muted)]">
                {roleLabel}
                {participant.is_muted ? ' · muted' : ''}
            </p>
        </div>
    );
}

function ListenerRow({ participant }) {
    const user = participant.user;
    const handRaised = Boolean(participant.speak_requested_at);

    return (
        <div className={`mf-stage-listener ${handRaised ? 'has-hand' : ''}`}>
            <Avatar user={user} size="sm" />
            <div className="min-w-0 flex-1">
                <p className="mf-stage-listener__name truncate">{user?.name || 'Fan'}</p>
                <p className="mf-mono mf-text-micro text-[var(--mf-muted)] truncate">
                    {user?.handle ? `@${user.handle}` : user?.fan_id}
                    {handRaised ? ' · hand raised' : ''}
                </p>
            </div>
        </div>
    );
}

/**
 * Stage room UI (speakers, controls, listeners). Source of truth: StageSession.
 * Room chat opens in a separate modal via the Chat control.
 */
export default function StageRoom() {
    const {
        room,
        voiceStatus,
        patchRoom,
        clearSession,
        minimize,
        openChat,
        chatUnread,
        unlockVoicePlayback,
        retryMicAccess,
    } = useStageSession();
    const { reportError, clearError } = useSocialFlash();
    const [hostPanelOpen, setHostPanelOpen] = useState(false);
    const [sharing, setSharing] = useState(false);

    if (!room?.stage) {
        return null;
    }

    const { stage, participants = [], me } = room;
    const isLive = stage?.status === 'live';
    const isHost = me?.role === 'host';
    const onStage = Boolean(me?.on_stage);
    const voiceEnabled = Boolean(stage?.voice_enabled);
    const speakers = participants.filter((p) => p.on_stage);
    const listeners = participants.filter((p) => !p.on_stage);
    const speakerCount = stage?.speaker_count ?? speakers.length;
    const inRoomCount = stage?.participant_count ?? participants.length;
    const listeningCount = Math.max(0, inRoomCount - speakerCount);
    const voiceChipLabel = !voiceEnabled
        ? 'Text lobby'
        : voiceStatus && voiceStatus !== 'Idle'
          ? voiceStatus
          : 'Voice on';
    const voiceChipOff = !voiceEnabled || !isLive;
    const statusLower = String(voiceStatus || '').toLowerCase();
    const isHearing = statusLower.includes('hearing');
    const audioBlocked =
        voiceEnabled && isLive && !isHearing && statusLower.includes('tap anywhere');
    const micNeedsRecovery = onStage && voiceEnabled && isLive && isMicBlockedStatus(voiceStatus);
    const chatAllowed = stage?.allow_chat !== false;
    const inviteAllowed = stage?.allow_invite !== false;
    const speakRequestsAllowed = stage?.allow_speak_requests !== false;

    function flashVisit(options = {}) {
        return withRollbackFlash(reportError, {
            preserveState: true,
            ...options,
            onSuccess: (...args) => {
                clearError();
                options.onSuccess?.(...args);
            },
        });
    }

    function shareToFeed() {
        if (sharing) {
            return;
        }
        setSharing(true);
        router.post(
            `/social/stage/${stage.id}/share`,
            {},
            flashVisit({
                onFinish: () => setSharing(false),
            }),
        );
    }

    return (
        <>
            <div className="mf-stage-room mf-stage-room--modal">
                <header className="mf-stage-room__head">
                    <div className="mf-stage-room__topline">
                        <div className="mf-stage-room__badges" aria-label="Stage status">
                            {isLive ? (
                                <span className="mf-stage-live-chip mf-stage-live-chip--pulse mf-mono">
                                    <span className="mf-stage-live-dot" aria-hidden />
                                    Live
                                </span>
                            ) : (
                                <span className="mf-stage-voice-chip mf-stage-voice-chip--off mf-mono">Ended</span>
                            )}
                            {isLive ? (
                                <span
                                    id="mf-stage-voice-status"
                                    className={`mf-stage-voice-chip mf-mono ${voiceChipOff ? 'mf-stage-voice-chip--off' : ''}`}
                                >
                                    {voiceChipLabel}
                                </span>
                            ) : null}
                        </div>

                        <div className="mf-stage-room__counts" aria-label="Participants">
                            <span className="mf-stage-stat mf-stage-stat--inline">
                                <span className="mf-stage-stat__value mf-mono">{listeningCount}</span>
                                <span className="mf-stage-stat__label">listening</span>
                            </span>
                        </div>
                    </div>

                    <p className="mf-stage-room__title">{stage?.title}</p>
                    {stage?.description ? (
                        <p className="mf-stage-room__description mf-text-meta text-[var(--mf-muted)]">
                            {stage.description}
                        </p>
                    ) : null}

                    <div className="mf-stage-room__identity">
                        <div className="mf-stage-room__host">
                            <Avatar user={stage?.host} size="sm" />
                            <div className="mf-stage-room__host-copy min-w-0">
                                <p className="mf-stage-room__host-name truncate">
                                    <span className="mf-stage-room__host-role">Host</span>
                                    {stage?.host?.name || 'Fan'}
                                    {stage?.host?.handle ? (
                                        <span className="mf-mono mf-stage-room__host-handle"> @{stage.host.handle}</span>
                                    ) : null}
                                </p>
                                {stage?.club?.name ? (
                                    <p className="mf-stage-room__club truncate">{stage.club.name}</p>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </header>

                <section className="mf-stage-deck" aria-label="On stage">
                    <div className="mf-stage-panel__head">
                        <p className="mf-text-caption text-[var(--mf-muted)]">On stage</p>
                        <span className="mf-mono mf-text-micro text-[var(--mf-muted)]">
                            {speakerCount}
                            {stage?.max_speakers != null ? `/${stage.max_speakers}` : ''}
                        </span>
                    </div>
                    <div className="mf-stage-stage__grid">
                        {speakers.length === 0 ? (
                            <p className="mf-text-meta text-[var(--mf-muted)] mf-stage-deck__empty">
                                Waiting for speakers…
                            </p>
                        ) : (
                            speakers.map((p) => <StagePerson key={p.id} participant={p} />)
                        )}
                    </div>
                </section>

                <div className="mf-stage-controls mf-stage-controls--icons" role="toolbar" aria-label="Stage controls">
                    <StageIconButton label="Minimize and keep listening" onClick={minimize}>
                        <IconMinimize />
                    </StageIconButton>

                    {chatAllowed ? (
                        <StageIconButton
                            label={chatUnread > 0 ? `Chat, ${chatUnread} unread` : 'Open chat'}
                            badge={chatUnread > 0 ? (chatUnread > 99 ? '99+' : chatUnread) : null}
                            onClick={openChat}
                        >
                            <IconChat />
                        </StageIconButton>
                    ) : null}

                    {isLive && me && inviteAllowed ? (
                        <StageIconButton
                            label="Share stage to feed"
                            pitch
                            disabled={sharing}
                            onClick={shareToFeed}
                        >
                            <IconShare />
                        </StageIconButton>
                    ) : null}

                    {isHost && isLive ? (
                        <StageIconButton label="Host controls" pitch onClick={() => setHostPanelOpen(true)}>
                            <IconHost />
                        </StageIconButton>
                    ) : null}

                    {isHost && isLive && !voiceEnabled ? (
                        <StageIconButton
                            label="Start voice"
                            pitch
                            onClick={() => {
                                unlockVoicePlayback?.();
                                void retryMicAccess?.();
                                patchRoom((props) => ({
                                    ...props,
                                    stage: props.stage ? { ...props.stage, voice_enabled: true } : props.stage,
                                    voice: props.voice ? { ...props.voice, enabled: true } : props.voice,
                                    me: props.me ? { ...props.me, is_muted: false } : props.me,
                                }));
                                router.post(`/social/stage/${stage.id}/voice`, {}, flashVisit());
                            }}
                        >
                            <IconVoice />
                        </StageIconButton>
                    ) : null}

                    {micNeedsRecovery ? (
                        <StageIconButton
                            label="Enable microphone"
                            pitch
                            onClick={() => {
                                void retryMicAccess?.();
                            }}
                        >
                            <IconMic />
                        </StageIconButton>
                    ) : null}

                    {onStage && isLive && voiceEnabled ? (
                        <StageIconButton
                            label={me.is_muted ? 'Unmute microphone' : 'Mute microphone'}
                            active={!me.is_muted}
                            pitch={!me.is_muted}
                            onClick={() => {
                                unlockVoicePlayback?.();
                                const nextMuted = me.is_muted ? 0 : 1;
                                if (nextMuted === 0) {
                                    void retryMicAccess?.();
                                }
                                patchRoom((props) => ({
                                    ...props,
                                    me: props.me ? { ...props.me, is_muted: Boolean(nextMuted) } : props.me,
                                    participants: (props.participants || []).map((p) =>
                                        p.user_id === me.user_id ? { ...p, is_muted: Boolean(nextMuted) } : p,
                                    ),
                                }));
                                router.post(
                                    `/social/stage/${stage.id}/mute`,
                                    { muted: nextMuted },
                                    flashVisit(),
                                );
                            }}
                        >
                            {me.is_muted ? <IconMicOff /> : <IconMic />}
                        </StageIconButton>
                    ) : null}

                    {me?.role === 'listener' && isLive && speakRequestsAllowed ? (
                        <StageIconButton
                            label={me.speak_requested_at ? 'Hand raised' : 'Request to speak'}
                            active={Boolean(me.speak_requested_at)}
                            disabled={Boolean(me.speak_requested_at)}
                            onClick={() => {
                                patchRoom((props) => ({
                                    ...props,
                                    me: props.me
                                        ? { ...props.me, speak_requested_at: new Date().toISOString() }
                                        : props.me,
                                    participants: (props.participants || []).map((p) =>
                                        p.user_id === me.user_id
                                            ? { ...p, speak_requested_at: new Date().toISOString() }
                                            : p,
                                    ),
                                }));
                                router.post(`/social/stage/${stage.id}/speak-request`, {}, flashVisit());
                            }}
                        >
                            <IconHand />
                        </StageIconButton>
                    ) : null}

                    {isLive && me ? (
                        <StageIconButton
                            label={isHost ? 'End and leave stage' : 'Leave stage'}
                            onClick={() => {
                                patchRoom((props) => ({
                                    ...props,
                                    me: null,
                                    participants: (props.participants || []).filter((p) => p.user_id !== me.user_id),
                                    stage: props.stage
                                        ? {
                                              ...props.stage,
                                              participant_count: Math.max(0, (props.stage.participant_count || 1) - 1),
                                          }
                                        : props.stage,
                                }));
                                router.post(
                                    `/social/stage/${stage.id}/leave`,
                                    {},
                                    flashVisit({
                                        onSuccess: () => clearSession(),
                                        onFinish: () => clearSession(),
                                    }),
                                );
                            }}
                        >
                            <IconLeave />
                        </StageIconButton>
                    ) : null}

                    {isHost && isLive ? (
                        <StageIconButton
                            label="End stage for everyone"
                            danger
                            onClick={() => {
                                patchRoom((props) => ({
                                    ...props,
                                    stage: props.stage
                                        ? {
                                              ...props.stage,
                                              status: 'ended',
                                              voice_enabled: false,
                                          }
                                        : props.stage,
                                }));
                                router.post(
                                    `/social/stage/${stage.id}/end`,
                                    {},
                                    flashVisit({
                                        onSuccess: () => clearSession(),
                                        onFinish: () => clearSession(),
                                    }),
                                );
                            }}
                        >
                            <IconEnd />
                        </StageIconButton>
                    ) : null}
                </div>

                {audioBlocked ? (
                    <p className="mf-stage-audio-hint mf-text-meta" role="status" aria-live="polite">
                        Audio paused — tap anywhere to hear
                    </p>
                ) : null}

                <div className="mf-stage-listeners">
                    <div className="mf-stage-panel__head">
                        <p className="mf-text-caption text-[var(--mf-muted)]">Listening</p>
                        <span className="mf-mono mf-text-micro text-[var(--mf-muted)]">{listeners.length}</span>
                    </div>
                    {listeners.length === 0 ? (
                        <p className="mf-text-meta text-[var(--mf-muted)]">No listeners yet.</p>
                    ) : (
                        listeners.map((p) => <ListenerRow key={p.id} participant={p} />)
                    )}
                </div>
            </div>

            <StageHostPanel open={hostPanelOpen} onClose={() => setHostPanelOpen(false)} />
        </>
    );
}
