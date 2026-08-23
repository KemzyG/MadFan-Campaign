import { useForm } from '@inertiajs/react';
import { useId } from 'react';
import { useSocialFlash, withRollbackFlash } from '../optimistic';
import { TextAreaField } from './StageFormFields';
import { IconLink, IconShare } from './StageIcons';
import StageSheet from './StageSheet';
import { useStageSession } from './StageSessionContext';

/**
 * Share the live stage to the terrace feed with an optional note, plus a
 * copy-link shortcut. Posts the same `body` the backend already accepts.
 */
export default function ShareStageSheet({ open, onClose }) {
    const labelId = useId();
    const { room } = useStageSession();
    const { reportError, reportSuccess } = useSocialFlash();
    const stage = room?.stage;
    const stageId = stage?.id;

    const { data, setData, post, processing, errors, reset } = useForm({ body: '' });

    if (!open || !stage) {
        return null;
    }

    function submit(e) {
        e.preventDefault();
        if (processing) {
            return;
        }
        post(
            `/social/stage/${stageId}/share`,
            withRollbackFlash(reportError, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    reset('body');
                    reportSuccess?.('Shared to the terrace feed.');
                    onClose();
                },
            }),
        );
    }

    function copyLink() {
        if (typeof window === 'undefined') {
            return;
        }
        const url = `${window.location.origin}/social/stage/${stageId}`;
        const clipboard = window.navigator?.clipboard;
        if (clipboard?.writeText) {
            clipboard.writeText(url).then(
                () => reportSuccess?.('Invite link copied.'),
                () => reportError?.('Could not copy the link.'),
            );
        } else {
            reportError?.('Copying is not available here.');
        }
    }

    const remaining = 280 - data.body.length;

    return (
        <StageSheet
            open={open}
            onClose={onClose}
            labelledBy={labelId}
            icon={<IconShare className="mf-stage-sheet__icon" />}
            eyebrow="Invite the terrace"
            title="Share this stage"
            subtitle="Post it to your feed so followers can drop in."
            className="mf-sheet--stage-share"
        >
            <form className="mf-stage-form" onSubmit={submit}>
                <div className="mf-stage-form__scroll">
                    <div className="mf-stage-share__preview">
                        <p className="mf-stage-share__preview-title truncate">{stage.title}</p>
                        <p className="mf-stage-share__preview-sub mf-text-micro text-[var(--mf-muted)]">
                            {stage.host?.name ? `Hosted by ${stage.host.name}` : 'Live now'}
                            {stage.club?.name ? ` · ${stage.club.name}` : ''}
                        </p>
                    </div>

                    <TextAreaField
                        id={`${labelId}-note`}
                        label="Add a note"
                        optional
                        rows={3}
                        maxLength={280}
                        placeholder="Come settle the derby debate…"
                        value={data.body}
                        onChange={(e) => setData('body', e.target.value)}
                        disabled={processing}
                        error={errors.body}
                    />

                    <button type="button" className="mf-stage-info__copy" onClick={copyLink}>
                        <IconLink className="mf-stage-info__copy-glyph" />
                        Copy invite link
                    </button>
                </div>

                <div className="mf-stage-form__foot">
                    <p className="mf-mono mf-text-micro text-[var(--mf-muted)]">{remaining} left</p>
                    <button type="submit" className="mf-btn mf-btn--pitch" disabled={processing}>
                        {processing ? 'Sharing…' : 'Share to feed'}
                    </button>
                </div>
            </form>
        </StageSheet>
    );
}
