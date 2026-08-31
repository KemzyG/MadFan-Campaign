import { router } from '@inertiajs/react';
import { useId } from 'react';
import { useSocialFlash, withRollbackFlash } from '../optimistic';
import { partitionParticipants, StageAvatar } from './helpers';
import { IconPromote } from './StageIcons';
import StageSheet from './StageSheet';
import { useStageSession } from './StageSessionContext';

/**
 * Host-only sheet opened by tapping an empty seat on the deck: pick any
 * listener (or someone with a raised hand) to fill it. Promoting always fills
 * the next open seat in render order — seats are interchangeable slots, not
 * individually tracked, so which literal square was tapped doesn't matter.
 */
export default function SeatPickerSheet({ open, onClose }) {
    const titleId = useId();
    const { room, patchRoom } = useStageSession();
    const { reportError } = useSocialFlash();

    const stage = room?.stage;
    const { listeners, handRaised } = partitionParticipants(room?.participants || []);
    const handRaisedIds = new Set(handRaised.map((p) => p.user_id));
    // Raised hands first — they already asked.
    const candidates = [...handRaised, ...listeners.filter((p) => !handRaisedIds.has(p.user_id))];

    function promote(participant) {
        patchRoom((props) => ({
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
            `/social/stage/${stage.id}/participants/${participant.user_id}/promote`,
            {},
            withRollbackFlash(reportError, { preserveState: true, onSuccess: onClose, onFinish: onClose }),
        );
    }

    return (
        <StageSheet
            open={open}
            onClose={onClose}
            labelledBy={titleId}
            title="Fill this seat"
            subtitle="Pick a fan to bring on stage"
        >
            <div className="mf-seat-picker__list">
                {candidates.length === 0 ? (
                    <p className="mf-text-meta text-[var(--mf-muted)] mf-seat-picker__empty">
                        No listeners to invite yet.
                    </p>
                ) : (
                    candidates.map((participant) => {
                        const user = participant.user;
                        return (
                            <button
                                key={participant.id}
                                type="button"
                                className="mf-seat-picker__row"
                                onClick={() => promote(participant)}
                            >
                                <StageAvatar user={user} size="md" className="mf-seat-picker__avatar" />
                                <span className="min-w-0 flex-1 text-left">
                                    <span className="mf-seat-picker__name truncate">{user?.name || 'Fan'}</span>
                                    <span className="mf-mono mf-text-micro text-[var(--mf-muted)] block truncate">
                                        {user?.handle ? `@${user.handle}` : user?.fan_id}
                                        {participant.speak_requested_at ? ' · hand raised' : ''}
                                    </span>
                                </span>
                                <span className="mf-seat-picker__cta" aria-hidden>
                                    <IconPromote />
                                </span>
                            </button>
                        );
                    })
                )}
            </div>
        </StageSheet>
    );
}
