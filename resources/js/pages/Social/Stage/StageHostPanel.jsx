import { router } from '@inertiajs/react';
import { useEffect, useId } from 'react';
import { useSocialFlash, withRollbackFlash } from '../optimistic';
import { useStageSession } from './StageSessionContext';
import { IconBan, IconClose, IconCrown, IconInvite, IconMic, IconMicOff } from './StageIcons';

function ParticipantActions({ participant, stageId, isHostView, onClose }) {
    const { reportError } = useSocialFlash();
    const { patchRoom } = useStageSession();
    const user = participant.user;
    const handRaised = Boolean(participant.speak_requested_at);
    const onStage = Boolean(participant.on_stage);
    const isHostRole = participant.role === 'host';

    function flashVisit() {
        return withRollbackFlash(reportError, { preserveState: true });
    }

    if (!isHostView || isHostRole) {
        return null;
    }

    return (
        <div className="mf-stage-host-row__actions">
            {!onStage ? (
                <button
                    type="button"
                    className={`mf-stage-icon-btn ${handRaised ? 'is-pitch' : ''}`}
                    aria-label={handRaised ? `Invite ${user?.name} to speak` : `Promote ${user?.name}`}
                    title={handRaised ? 'Invite to stage' : 'Promote to speaker'}
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
                            flashVisit(),
                        );
                    }}
                >
                    <IconInvite />
                </button>
            ) : (
                <>
                    <button
                        type="button"
                        className="mf-stage-icon-btn"
                        aria-label={participant.is_muted ? `Unmute ${user?.name}` : `Mute ${user?.name}`}
                        title={participant.is_muted ? 'Unmute speaker' : 'Mute speaker'}
                        onClick={() => {
                            const nextMuted = !participant.is_muted;
                            patchRoom((props) => ({
                                ...props,
                                participants: (props.participants || []).map((p) =>
                                    p.user_id === participant.user_id
                                        ? { ...p, is_muted: nextMuted }
                                        : p,
                                ),
                            }));
                            router.post(
                                `/social/stage/${stageId}/participants/${participant.user_id}/host-mute`,
                                { muted: nextMuted ? 1 : 0 },
                                flashVisit(),
                            );
                        }}
                    >
                        {participant.is_muted ? <IconMicOff /> : <IconMic />}
                    </button>
                    <button
                        type="button"
                        className="mf-stage-icon-btn"
                        aria-label={`Demote ${user?.name}`}
                        title="Move to listeners"
                        onClick={() => {
                            patchRoom((props) => ({
                                ...props,
                                participants: (props.participants || []).map((p) =>
                                    p.user_id === participant.user_id
                                        ? { ...p, role: 'listener', on_stage: false, is_muted: true }
                                        : p,
                                ),
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
                                flashVisit(),
                            );
                        }}
                    >
                        ↓
                    </button>
                </>
            )}

            <button
                type="button"
                className="mf-stage-icon-btn is-danger"
                aria-label={`Ban ${user?.name}`}
                title="Remove and ban"
                onClick={() => {
                    patchRoom((props) => ({
                        ...props,
                        participants: (props.participants || []).filter(
                            (p) => p.user_id !== participant.user_id,
                        ),
                        stage: props.stage
                            ? {
                                  ...props.stage,
                                  participant_count: Math.max(0, (props.stage.participant_count || 1) - 1),
                              }
                            : props.stage,
                    }));
                    router.post(
                        `/social/stage/${stageId}/participants/${participant.user_id}/ban`,
                        {},
                        flashVisit({ onSuccess: onClose }),
                    );
                }}
            >
                <IconBan />
            </button>

            <button
                type="button"
                className="mf-stage-icon-btn is-pitch"
                aria-label={`Transfer host to ${user?.name}`}
                title="Transfer host"
                onClick={() => {
                    patchRoom((props) => ({
                        ...props,
                        stage: props.stage
                            ? {
                                  ...props.stage,
                                  host: user,
                              }
                            : props.stage,
                        me:
                            props.me?.role === 'host'
                                ? { ...props.me, role: 'speaker', is_muted: true }
                                : props.me?.user_id === participant.user_id
                                  ? { ...props.me, role: 'host', is_muted: false, on_stage: true }
                                  : props.me,
                        participants: (props.participants || []).map((p) => {
                            if (p.user_id === participant.user_id) {
                                return { ...p, role: 'host', on_stage: true, is_muted: false };
                            }
                            if (p.role === 'host') {
                                return { ...p, role: 'speaker', is_muted: true };
                            }
                            return p;
                        }),
                    }));
                    router.post(
                        `/social/stage/${stageId}/transfer-host`,
                        { user_id: participant.user_id },
                        flashVisit({ onSuccess: onClose }),
                    );
                }}
            >
                <IconCrown />
            </button>
        </div>
    );
}

export default function StageHostPanel({ open, onClose }) {
    const titleId = useId();
    const { room } = useStageSession();

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        function onKeyDown(event) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    if (!open || !room?.stage) {
        return null;
    }

    const { stage, participants = [], me } = room;
    const isHost = me?.role === 'host';
    const isLive = stage.status === 'live';

    if (!isHost || !isLive) {
        return null;
    }

    const others = participants.filter((p) => p.user_id !== me.user_id);

    return (
        <div className="mf-stage-host-panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <button type="button" className="mf-stage-host-panel__backdrop" aria-label="Close host controls" onClick={onClose} />
            <div className="mf-stage-host-panel__sheet">
                <div className="mf-stage-host-panel__head">
                    <div>
                        <p id={titleId} className="mf-text-caption text-[var(--mf-pitch)]">
                            Host controls
                        </p>
                        <p className="mf-stage-host-panel__title">Permissions & room</p>
                    </div>
                    <button type="button" className="mf-stage-icon-btn" aria-label="Close" title="Close" onClick={onClose}>
                        <IconClose />
                    </button>
                </div>

                <p className="mf-text-meta text-[var(--mf-muted)] mf-stage-host-panel__hint">
                    Invite speakers, mute, transfer host, or remove fans. Max {stage.max_speakers ?? 8} on stage.
                </p>

                <div className="mf-stage-host-panel__list">
                    {others.length === 0 ? (
                        <p className="mf-text-meta text-[var(--mf-muted)]">No other fans in the room yet.</p>
                    ) : (
                        others.map((participant) => {
                            const user = participant.user;
                            const roleLabel =
                                participant.role === 'speaker'
                                    ? 'Speaker'
                                    : participant.speak_requested_at
                                      ? 'Hand raised'
                                      : 'Listener';

                            return (
                                <div
                                    key={participant.id}
                                    className={`mf-stage-host-row ${participant.speak_requested_at ? 'has-hand' : ''}`}
                                >
                                    <div className="mf-stage-host-row__meta min-w-0">
                                        <p className="mf-stage-host-row__name truncate">{user?.name || 'Fan'}</p>
                                        <p className="mf-mono mf-text-micro text-[var(--mf-muted)] truncate">
                                            {user?.handle ? `@${user.handle}` : user?.fan_id} · {roleLabel}
                                            {participant.on_stage && participant.is_muted ? ' · muted' : ''}
                                        </p>
                                    </div>
                                    <ParticipantActions
                                        participant={participant}
                                        stageId={stage.id}
                                        isHostView
                                        onClose={onClose}
                                    />
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
