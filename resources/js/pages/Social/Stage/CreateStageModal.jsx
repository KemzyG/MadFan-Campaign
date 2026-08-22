import { useForm, usePage } from '@inertiajs/react';
import { useEffect, useId } from 'react';
import { IconClose, IconLive } from './StageIcons';
import { useSocialFlash, withRollbackFlash } from '../optimistic';

export default function CreateStageModal({ open, onClose, maxTitleLength }) {
    const titleId = useId();
    const page = usePage();
    const authUser = page.props?.auth?.user;
    const { reportError } = useSocialFlash();
    const { data, setData, post, processing, errors, reset, optimistic } = useForm({
        title: '',
    });

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        function onKeyDown(event) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = previous;
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    function submit(e) {
        e.preventDefault();
        if (!data.title.trim()) {
            return;
        }

        const tempId = `tmp-${Date.now()}`;
        const title = data.title.trim();

        optimistic((props) => ({
            stages: [
                {
                    id: tempId,
                    title,
                    status: 'live',
                    voice_enabled: false,
                    started_at: new Date().toISOString(),
                    host: {
                        id: authUser?.id,
                        name: authUser?.name || 'You',
                        handle: authUser?.handle,
                        avatar_url: authUser?.avatar_url,
                        avatar_emoji: authUser?.avatar_emoji,
                    },
                    club: null,
                    speaker_count: 1,
                    listener_count: 0,
                    participant_count: 1,
                    _optimistic: true,
                },
                ...(props.stages || []),
            ],
        })).post(
            '/social/stage',
            withRollbackFlash(reportError, {
                onSuccess: () => {
                    reset('title');
                    onClose();
                },
            }),
        );
    }

    const remaining = maxTitleLength - data.title.length;
    const canGoLive = data.title.trim().length >= 3 && !processing;

    return (
        <div className="mf-sheet mf-sheet--stage-create" role="presentation">
            <button type="button" className="mf-sheet__backdrop" aria-label="Close" onClick={onClose} />
            <div className="mf-sheet__panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
                <div className="mf-sheet__handle" aria-hidden />
                <div className="mf-sheet__head">
                    <div className="mf-stage-create-modal__brand">
                        <IconLive className="mf-stage-create-modal__icon" />
                        <div>
                            <p id={titleId} className="mf-display mf-text-title tracking-[0.03em]">
                                Go live
                            </p>
                            <p className="mf-text-meta text-[var(--mf-muted)]">
                                Open a voice room — fans drop in as listeners.
                            </p>
                        </div>
                    </div>
                    <button type="button" className="mf-stage-icon-btn" aria-label="Close" title="Close" onClick={onClose}>
                        <IconClose />
                    </button>
                </div>

                <form className="mf-stage-create-modal" onSubmit={submit}>
                    <label className="sr-only" htmlFor="stage-title-modal">
                        Stage title
                    </label>
                    <input
                        id="stage-title-modal"
                        className="mf-stage-create__input"
                        maxLength={maxTitleLength}
                        placeholder="Match reaction, transfer window, derby debate…"
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                        disabled={processing}
                        autoComplete="off"
                        autoFocus
                    />
                    <div className="mf-stage-create-modal__foot">
                        {errors.title ? (
                            <p className="mf-field-error">{errors.title}</p>
                        ) : (
                            <p className="mf-mono mf-text-micro text-[var(--mf-muted)]">
                                {remaining} chars · min 3
                            </p>
                        )}
                        <button type="submit" className="mf-btn mf-btn--pitch" disabled={!canGoLive}>
                            {processing ? 'Opening…' : 'Go live'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
