import { router } from '@inertiajs/react';
import { useEffect, useId, useState } from 'react';
import { socialApi } from '../../../lib/socialApi';
import { useSocialFlash, withRollbackFlash } from '../optimistic';
import { StageAvatar } from './helpers';
import { IconInvite } from './StageIcons';
import StageSheet from './StageSheet';
import { useStageSession } from './StageSessionContext';

/**
 * Direct, targeted invites: pick from your follow connections, they each get
 * a notification that deep-links straight into this room. Separate from
 * ShareStageSheet, which posts a public share card to the feed instead.
 */
export default function InviteStageSheet({ open, onClose }) {
    const labelId = useId();
    const { room } = useStageSession();
    const { reportError, reportSuccess } = useSocialFlash();
    const stage = room?.stage;
    const stageId = stage?.id;

    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState([]);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!open || !stageId) {
            return;
        }

        setLoading(true);
        socialApi(`/stage/${stageId}/invite-candidates`)
            .then((data) => setCandidates(data?.data ?? []))
            .catch(() => reportError?.('Could not load who to invite.'))
            .finally(() => setLoading(false));
    }, [open, stageId]);

    useEffect(() => {
        if (!open) {
            setSelected([]);
        }
    }, [open]);

    if (!open || !stage) {
        return null;
    }

    function toggle(id) {
        setSelected((current) =>
            (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
    }

    function submit(e) {
        e.preventDefault();
        if (processing || selected.length === 0) {
            return;
        }

        setProcessing(true);
        router.post(
            `/social/stage/${stageId}/invite`,
            { user_ids: selected },
            withRollbackFlash(reportError, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setSelected([]);
                    reportSuccess?.(selected.length === 1 ? 'Invite sent.' : `${selected.length} invites sent.`);
                    onClose();
                },
                onFinish: () => setProcessing(false),
            }),
        );
    }

    return (
        <StageSheet
            open={open}
            onClose={onClose}
            labelledBy={labelId}
            icon={<IconInvite className="mf-stage-sheet__icon" />}
            eyebrow="Invite people"
            title="Bring fans into the room"
            subtitle="They'll get a notification that opens straight into this Stage."
            className="mf-sheet--stage-invite"
        >
            <form className="mf-stage-form" onSubmit={submit}>
                <div className="mf-stage-form__scroll">
                    {loading ? (
                        <p className="mf-convo-new__hint mf-text-meta">Loading…</p>
                    ) : candidates.length ? (
                        <ul className="mf-convo-new__list">
                            {candidates.map((fan) => {
                                const checked = selected.includes(fan.id);
                                return (
                                    <li key={fan.id}>
                                        <button
                                            type="button"
                                            className={checked ? 'is-selected' : ''}
                                            onClick={() => toggle(fan.id)}
                                            aria-pressed={checked}
                                        >
                                            <StageAvatar user={fan} size="sm" />
                                            <span className="min-w-0">
                                                <span className="mf-convo-new__name">{fan.name}</span>
                                                {fan.handle ? (
                                                    <span className="mf-text-meta text-[var(--mf-muted)]">
                                                        @{fan.handle}
                                                    </span>
                                                ) : null}
                                            </span>
                                            <span className="mf-convo-new__check" aria-hidden>
                                                {checked ? '✓' : ''}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="mf-convo-new__hint mf-text-meta">
                            Follow fans first — you can only invite people you're connected to.
                        </p>
                    )}
                </div>

                <div className="mf-stage-form__foot">
                    <p className="mf-mono mf-text-micro text-[var(--mf-muted)]">
                        {selected.length ? `${selected.length} selected` : ' '}
                    </p>
                    <button
                        type="submit"
                        className="mf-btn mf-btn--pitch"
                        disabled={processing || selected.length === 0}
                    >
                        {processing ? 'Inviting…' : 'Send invite'}
                    </button>
                </div>
            </form>
        </StageSheet>
    );
}
