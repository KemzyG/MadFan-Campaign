import { router, usePage } from '@inertiajs/react';
import { onImageError, resolveDefaultImageUrl } from '../../../lib/defaultImage';
import { useSocialFlash, withRollbackFlash } from '../optimistic';
import { isMicBlockedStatus } from './stageMicPermission';
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

function StagePerson({ participant, isHostView, stageId }) {
    const user = participant.user;
    const { reportError } = useSocialFlash();
    const { patchRoom } = useStageSession();
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
            {isHostView && participant.role === 'speaker' ? (
                <button
                    type="button"
                    className="mf-stage-mini-btn"
                    onClick={() => {
                        patchRoom((props) => ({
                            ...props,
                            participants: (props.participants || []).map((p) =>
                                p.user_id === participant.user_id
                                    ? { ...p, role: 'listener', on_stage: false, is_muted: true }
                                    : p,
                            ),
                            me:
                                props.me?.user_id === participant.user_id
                                    ? { ...props.me, role: 'listener', on_stage: false, is_muted: true }
                                    : props.me,
                            stage: props.stage
                                ? {
                                      ...props.stage,
                                      speaker_count: Math.max(0, (props.stage.speaker_count || 1) - 1),
                                  }
                                : props.stage,
                        }));
                        router.post(
                            `/social/stage/${stageId}/participants/${participant.user_id}/demote`,
                            {},
                            withRollbackFlash(reportError, { preserveState: true }),
                        );
                    }}
                >
                    To listeners
                </button>
            ) : null}
        </div>
    );
}

function ListenerRow({ participant, isHostView, stageId }) {
    const user = participant.user;
    const { reportError } = useSocialFlash();
    const { patchRoom } = useStageSession();
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
            {isHostView ? (
                <button
                    type="button"
                    className={`mf-stage-mini-btn ${handRaised ? 'mf-btn mf-btn--pitch' : ''}`}
                    onClick={() => {
                        patchRoom((props) => ({
                            ...props,
                            participants: (props.participants || []).map((p) =>
                                p.user_id === participant.user_id
                                    ? {
                                          ...p,
                                          role: 'speaker',
                                          on_stage: true,
                                          speak_requested_at: null,
                                          is_muted: true,
                                      }
                                    : p,
                            ),
                            stage: props.stage
                                ? {
                                      ...props.stage,
                                      speaker_count: (props.stage.speaker_count || 0) + 1,
                                  }
                                : props.stage,
                        }));
                        router.post(
                            `/social/stage/${stageId}/participants/${participant.user_id}/promote`,
                            {},
                            withRollbackFlash(reportError, { preserveState: true }),
                        );
                    }}
                >
                    {handRaised ? 'Invite' : 'Promote'}
                </button>
            ) : null}
        </div>
    );
}

/**
 * Stage room UI (speakers, controls, listeners). Source of truth: StageSession.
 * Room chat opens in a separate modal via the Chat control.
 */
export default function StageRoom() {
    const { room, voiceStatus, patchRoom, clearSession, minimize, openChat, chatUnread, unlockVoicePlayback, retryMicAccess } =
        useStageSession();
    const { reportError, clearError } = useSocialFlash();

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
    const needsHearUnlock = voiceEnabled && isLive && !isHearing;
    const hearLabel = isHearing ? 'Hearing ✓' : 'Tap to hear';
    const micNeedsRecovery = onStage && voiceEnabled && isLive && isMicBlockedStatus(voiceStatus);

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

    return (
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
                            <span className="mf-stage-stat__value mf-mono">
                                {speakerCount}
                                {stage?.max_speakers != null ? (
                                    <span className="mf-stage-stat__cap">/{stage.max_speakers}</span>
                                ) : null}
                            </span>
                            <span className="mf-stage-stat__label">on stage</span>
                        </span>
                        <span className="mf-stage-stat mf-stage-stat--inline">
                            <span className="mf-stage-stat__value mf-mono">{listeningCount}</span>
                            <span className="mf-stage-stat__label">listening</span>
                        </span>
                        <span className="mf-stage-stat mf-stage-stat--inline">
                            <span className="mf-stage-stat__value mf-mono">{inRoomCount}</span>
                            <span className="mf-stage-stat__label">in room</span>
                        </span>
                    </div>
                </div>

                <p className="mf-stage-room__title">{stage?.title}</p>

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

                    {room.voice?.note ? (
                        <p className="mf-stage-room__voice-note mf-mono">{room.voice.note}</p>
                    ) : null}
                </div>
            </header>

            <section className="mf-stage-deck" aria-label="On stage">
                <div className="mf-stage-panel__head">
                    <p className="mf-text-caption text-[var(--mf-muted)]">On stage</p>
                    <span className="mf-mono mf-text-micro text-[var(--mf-muted)]">{speakers.length}</span>
                </div>
                <div className="mf-stage-stage__grid">
                    {speakers.length === 0 ? (
                        <p className="mf-text-meta text-[var(--mf-muted)] mf-stage-deck__empty">
                            Waiting for speakers…
                        </p>
                    ) : (
                        speakers.map((p) => (
                            <StagePerson
                                key={p.id}
                                participant={p}
                                isHostView={isHost && isLive}
                                stageId={stage.id}
                            />
                        ))
                    )}
                </div>
            </section>

            <div className="mf-stage-controls" role="toolbar" aria-label="Stage controls">
                <button type="button" className="mf-btn" onClick={minimize}>
                    Minimize
                </button>

                <button
                    type="button"
                    className="mf-btn mf-stage-chat-btn"
                    onClick={openChat}
                    aria-label={chatUnread > 0 ? `Chat, ${chatUnread} unread` : 'Chat'}
                >
                    Chat
                    {chatUnread > 0 ? (
                        <span className="mf-stage-chat-btn__badge mf-mono" aria-hidden>
                            {chatUnread > 99 ? '99+' : chatUnread}
                        </span>
                    ) : null}
                </button>

                {isHost && isLive && !voiceEnabled ? (
                    <button
                        type="button"
                        className="mf-btn mf-btn--pitch"
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
                        Start voice
                    </button>
                ) : null}

                {micNeedsRecovery ? (
                    <button
                        type="button"
                        className="mf-btn mf-btn--pitch"
                        onClick={() => {
                            void retryMicAccess?.();
                        }}
                    >
                        Enable microphone
                    </button>
                ) : null}

                {onStage && isLive && voiceEnabled ? (
                    <button
                        type="button"
                        className="mf-btn mf-btn--pitch"
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
                        {me.is_muted ? 'Unmute' : 'Mute'}
                    </button>
                ) : null}

                {isLive && voiceEnabled ? (
                    <button
                        type="button"
                        className={`mf-btn mf-stage-hear-btn ${
                            needsHearUnlock ? 'mf-btn--pitch' : ''
                        }`}
                        data-stage-hear-unlock="1"
                        aria-pressed={!needsHearUnlock}
                        aria-describedby="mf-stage-voice-status"
                        onPointerDown={(event) => {
                            // Prefer pointerdown so WebKit keeps the user-gesture token for play().
                            if (event.pointerType === 'mouse' && event.button !== 0) {
                                return;
                            }
                            event.stopPropagation();
                            unlockVoicePlayback?.();
                        }}
                        onClick={(event) => {
                            // Keyboard activation (Enter/Space): detail === 0; mouse/touch already unlocked on pointerdown.
                            event.preventDefault();
                            event.stopPropagation();
                            if (event.detail === 0) {
                                unlockVoicePlayback?.();
                            }
                        }}
                    >
                        {hearLabel}
                    </button>
                ) : null}

                {me?.role === 'listener' && isLive ? (
                    <button
                        type="button"
                        className="mf-btn"
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
                        {me.speak_requested_at ? 'Hand raised' : 'Request to speak'}
                    </button>
                ) : null}

                {isLive && me ? (
                    <button
                        type="button"
                        className="mf-btn"
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
                        {isHost ? 'End & leave' : 'Leave'}
                    </button>
                ) : null}

                {isHost && isLive ? (
                    <button
                        type="button"
                        className="mf-btn mf-stage-btn-danger"
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
                        End Stage
                    </button>
                ) : null}
            </div>

            <div className="mf-stage-listeners">
                <div className="mf-stage-panel__head">
                    <p className="mf-text-caption text-[var(--mf-muted)]">Listening</p>
                    <span className="mf-mono mf-text-micro text-[var(--mf-muted)]">{listeners.length}</span>
                </div>
                {listeners.length === 0 ? (
                    <p className="mf-text-meta text-[var(--mf-muted)]">No listeners yet.</p>
                ) : (
                    listeners.map((p) => (
                        <ListenerRow
                            key={p.id}
                            participant={p}
                            isHostView={isHost && isLive}
                            stageId={stage.id}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
