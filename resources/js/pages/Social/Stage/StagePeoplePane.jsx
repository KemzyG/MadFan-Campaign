import { router } from '@inertiajs/react';
import { useSocialFlash, withRollbackFlash } from '../optimistic';
import { isMe, partitionParticipants, roleLabel, StageAvatar } from './helpers';
import {
    IconBan,
    IconCrown,
    IconDismissHand,
    IconDemote,
    IconMic,
    IconMicOff,
    IconPromote,
} from './StageIcons';
import { useStageSession } from './StageSessionContext';

/**
 * Host moderation buttons for one participant. All mutations patch the room
 * immediately and roll back through the shared flash — lifted verbatim from the
 * old StageHostPanel, plus a dismiss-hand action for the raised-hand queue.
 */
function ParticipantActions({ participant, stageId, section }) {
    const { reportError } = useSocialFlash();
    const { patchRoom } = useStageSession();
    const user = participant.user;
    const name = user?.name || 'Fan';

    function flashVisit(options = {}) {
        return withRollbackFlash(reportError, { preserveState: true, ...options });
    }

    function promote() {
        const rollback = patchRoom((props) => ({
            ...props,
            participants: (props.participants || []).map((p) =>
                p.user_id === participant.user_id
                    ? { ...p, role: 'speaker', on_stage: true, speak_requested_at: null, is_muted: true }
                    : p,
            ),
            stage: props.stage
                ? { ...props.stage, speaker_count: (props.stage.speaker_count || 0) + 1 }
                : props.stage,
        }));
        router.post(
            `/social/stage/${stageId}/participants/${participant.user_id}/promote`,
            {},
            flashVisit({ rollback }),
        );
    }

    function dismissHand() {
        const rollback = patchRoom((props) => ({
            ...props,
            participants: (props.participants || []).map((p) =>
                p.user_id === participant.user_id ? { ...p, speak_requested_at: null } : p,
            ),
        }));
        router.post(
            `/social/stage/${stageId}/participants/${participant.user_id}/dismiss-hand`,
            {},
            flashVisit({ rollback }),
        );
    }

    function toggleHostMute() {
        const nextMuted = !participant.is_muted;
        const rollback = patchRoom((props) => ({
            ...props,
            participants: (props.participants || []).map((p) =>
                p.user_id === participant.user_id ? { ...p, is_muted: nextMuted } : p,
            ),
        }));
        router.post(
            `/social/stage/${stageId}/participants/${participant.user_id}/host-mute`,
            { muted: nextMuted ? 1 : 0 },
            flashVisit({ rollback }),
        );
    }

    function demote() {
        const rollback = patchRoom((props) => ({
            ...props,
            participants: (props.participants || []).map((p) =>
                p.user_id === participant.user_id
                    ? { ...p, role: 'listener', on_stage: false, is_muted: true }
                    : p,
            ),
            stage: props.stage
                ? { ...props.stage, speaker_count: Math.max(0, (props.stage.speaker_count || 1) - 1) }
                : props.stage,
        }));
        router.post(
            `/social/stage/${stageId}/participants/${participant.user_id}/demote`,
            {},
            flashVisit({ rollback }),
        );
    }

    function ban() {
        const rollback = patchRoom((props) => ({
            ...props,
            participants: (props.participants || []).filter((p) => p.user_id !== participant.user_id),
            stage: props.stage
                ? { ...props.stage, participant_count: Math.max(0, (props.stage.participant_count || 1) - 1) }
                : props.stage,
        }));
        router.post(`/social/stage/${stageId}/participants/${participant.user_id}/ban`, {}, flashVisit({ rollback }));
    }

    function transferHost() {
        const rollback = patchRoom((props) => ({
            ...props,
            stage: props.stage ? { ...props.stage, host: user } : props.stage,
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
            flashVisit({ rollback }),
        );
    }

    return (
        <div className="mf-stage-person__actions">
            {section === 'hand' ? (
                <>
                    <button
                        type="button"
                        className="mf-stage-icon-btn is-pitch"
                        aria-label={`Invite ${name} to speak`}
                        title="Invite to stage"
                        onClick={promote}
                    >
                        <IconPromote />
                    </button>
                    <button
                        type="button"
                        className="mf-stage-icon-btn"
                        aria-label={`Dismiss ${name}'s raised hand`}
                        title="Dismiss hand"
                        onClick={dismissHand}
                    >
                        <IconDismissHand />
                    </button>
                </>
            ) : null}

            {section === 'listener' ? (
                <button
                    type="button"
                    className="mf-stage-icon-btn is-pitch"
                    aria-label={`Promote ${name} to speaker`}
                    title="Promote to speaker"
                    onClick={promote}
                >
                    <IconPromote />
                </button>
            ) : null}

            {section === 'speaker' ? (
                <>
                    <button
                        type="button"
                        className="mf-stage-icon-btn"
                        aria-label={participant.is_muted ? `Unmute ${name}` : `Mute ${name}`}
                        title={participant.is_muted ? 'Unmute speaker' : 'Mute speaker'}
                        onClick={toggleHostMute}
                    >
                        {participant.is_muted ? <IconMicOff /> : <IconMic />}
                    </button>
                    <button
                        type="button"
                        className="mf-stage-icon-btn"
                        aria-label={`Move ${name} to listeners`}
                        title="Move to listeners"
                        onClick={demote}
                    >
                        <IconDemote />
                    </button>
                    <button
                        type="button"
                        className="mf-stage-icon-btn is-pitch"
                        aria-label={`Transfer host to ${name}`}
                        title="Transfer host"
                        onClick={transferHost}
                    >
                        <IconCrown />
                    </button>
                </>
            ) : null}

            <button
                type="button"
                className="mf-stage-icon-btn is-danger"
                aria-label={`Remove and ban ${name}`}
                title="Remove and ban"
                onClick={ban}
            >
                <IconBan />
            </button>
        </div>
    );
}

/** One participant line: avatar, name, handle · role, and (host only) actions. */
function ParticipantRow({ participant, stageId, section, canManage, mine, focused }) {
    const user = participant.user;
    const muted = participant.on_stage && participant.is_muted;
    const showActions = canManage && !mine && participant.role !== 'host';

    return (
        <li
            className={[
                'mf-stage-person',
                participant.speak_requested_at ? 'has-hand' : '',
                focused ? 'is-focused' : '',
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <StageAvatar user={user} size="md" className="mf-stage-person__avatar" />
            <div className="mf-stage-person__meta min-w-0">
                <p className="mf-stage-person__name truncate">
                    {user?.name || 'Fan'}
                    {mine ? <span className="mf-stage-person__you"> (you)</span> : null}
                </p>
                <p className="mf-stage-person__sub mf-mono mf-text-micro truncate">
                    {user?.handle ? `@${user.handle}` : user?.fan_id}
                    {' · '}
                    {roleLabel(participant.role)}
                    {muted ? ' · muted' : ''}
                </p>
            </div>
            {showActions ? <ParticipantActions participant={participant} stageId={stageId} section={section} /> : null}
        </li>
    );
}

function Section({ title, count, hint, children }) {
    return (
        <section className="mf-stage-people__section">
            <div className="mf-stage-people__section-head">
                <h3 className="mf-stage-people__section-title">
                    {title}
                    <span className="mf-stage-people__count mf-mono">{count}</span>
                </h3>
                {hint ? <span className="mf-stage-people__section-hint mf-text-micro">{hint}</span> : null}
            </div>
            {children}
        </section>
    );
}

/**
 * The People rail pane: raised-hand queue first (host can invite or dismiss),
 * then on-stage speakers, then listeners. `focusUserId` briefly highlights the
 * row jumped to from a speaker tile.
 */
export default function StagePeoplePane({ focusUserId = null }) {
    const { room } = useStageSession();
    const stage = room?.stage;
    const me = room?.me;

    if (!stage) {
        return null;
    }

    const stageId = stage.id;
    const canManage = me?.role === 'host' && stage.status === 'live';
    const { speakers, listeners, handRaised } = partitionParticipants(room?.participants || []);
    // Listeners with a raised hand are surfaced in their own queue above.
    const plainListeners = listeners.filter((p) => !p.speak_requested_at);

    return (
        <div className="mf-stage-people" aria-label="People in this stage">
            {handRaised.length > 0 ? (
                <Section
                    title="Raised hands"
                    count={handRaised.length}
                    hint={canManage ? 'Oldest first' : null}
                >
                    <ul className="mf-stage-people__list">
                        {handRaised.map((participant) => (
                            <ParticipantRow
                                key={participant.id}
                                participant={participant}
                                stageId={stageId}
                                section="hand"
                                canManage={canManage}
                                mine={isMe(participant, me)}
                                focused={focusUserId === participant.user_id}
                            />
                        ))}
                    </ul>
                </Section>
            ) : null}

            <Section title="On stage" count={speakers.length}>
                <ul className="mf-stage-people__list">
                    {speakers.map((participant) => (
                        <ParticipantRow
                            key={participant.id}
                            participant={participant}
                            stageId={stageId}
                            section="speaker"
                            canManage={canManage}
                            mine={isMe(participant, me)}
                            focused={focusUserId === participant.user_id}
                        />
                    ))}
                </ul>
            </Section>

            <Section title="Listeners" count={plainListeners.length}>
                {plainListeners.length === 0 ? (
                    <p className="mf-stage-people__empty mf-text-meta text-[var(--mf-muted)]">
                        No listeners yet.
                    </p>
                ) : (
                    <ul className="mf-stage-people__list">
                        {plainListeners.map((participant) => (
                            <ParticipantRow
                                key={participant.id}
                                participant={participant}
                                stageId={stageId}
                                section="listener"
                                canManage={canManage}
                                mine={isMe(participant, me)}
                                focused={focusUserId === participant.user_id}
                            />
                        ))}
                    </ul>
                )}
            </Section>
        </div>
    );
}
