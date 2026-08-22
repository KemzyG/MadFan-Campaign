import { useForm, usePage } from '@inertiajs/react';
import { useEffect, useId } from 'react';
import { IconClose, IconLive } from './StageIcons';
import { useSocialFlash, withRollbackFlash } from '../optimistic';

function SwitchRow({ id, label, hint, checked, onChange, disabled }) {
    return (
        <label className="mf-stage-create-switch" htmlFor={id}>
            <span className="mf-stage-create-switch__copy">
                <span className="mf-stage-create-switch__label">{label}</span>
                {hint ? <span className="mf-stage-create-switch__hint">{hint}</span> : null}
            </span>
            <span className="mf-switch">
                <input
                    id={id}
                    type="checkbox"
                    className="mf-switch__input"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={disabled}
                    role="switch"
                    aria-checked={checked}
                />
                <span className="mf-switch__track" aria-hidden />
            </span>
        </label>
    );
}

export default function CreateStageModal({
    open,
    onClose,
    maxTitleLength,
    maxDescriptionLength = 280,
    stageBackgrounds = [],
}) {
    const titleId = useId();
    const page = usePage();
    const authUser = page.props?.auth?.user;
    const { reportError } = useSocialFlash();
    const defaultBackground = stageBackgrounds[0]?.key ?? 1;
    const { data, setData, post, processing, errors, reset, optimistic } = useForm({
        title: '',
        description: '',
        is_public: true,
        allow_invite: true,
        allow_chat: true,
        allow_speak_requests: true,
        background_key: defaultBackground,
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
        const selectedBackground =
            stageBackgrounds.find((bg) => bg.key === data.background_key) ?? stageBackgrounds[0];

        optimistic((props) => ({
            stages: [
                {
                    id: tempId,
                    title,
                    description: data.description.trim() || null,
                    status: 'live',
                    is_public: data.is_public,
                    allow_invite: data.allow_invite,
                    allow_chat: data.allow_chat,
                    allow_speak_requests: data.allow_speak_requests,
                    background_key: data.background_key,
                    background_url: selectedBackground?.url,
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
                    reset();
                    onClose();
                },
            }),
        );
    }

    const remaining = maxTitleLength - data.title.length;
    const descriptionRemaining = maxDescriptionLength - data.description.length;
    const canGoLive = data.title.trim().length >= 3 && !processing;

    return (
        <div className="mf-sheet mf-sheet--stage-create" role="presentation">
            <button type="button" className="mf-sheet__backdrop" aria-label="Close" onClick={onClose} />
            <div
                className="mf-sheet__panel mf-sheet__panel--stage-create"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
            >
                <div className="mf-sheet__handle" aria-hidden />

                <div className="mf-sheet__head mf-sheet__head--stage-create">
                    <div className="mf-stage-create-modal__brand">
                        <span className="mf-stage-create-modal__icon-wrap" aria-hidden>
                            <IconLive className="mf-stage-create-modal__icon" />
                        </span>
                        <div className="min-w-0">
                            <p id={titleId} className="mf-display mf-text-title tracking-[0.03em]">
                                Go live
                            </p>
                            <p className="mf-text-meta text-[var(--mf-muted)]">
                                Name your room and set the terrace rules.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="mf-stage-icon-btn mf-stage-create-modal__close"
                        aria-label="Close"
                        title="Close"
                        onClick={onClose}
                    >
                        <IconClose />
                    </button>
                </div>

                <form className="mf-stage-create-modal" onSubmit={submit}>
                    <div className="mf-stage-create-modal__scroll">
                        <section className="mf-stage-create-section" aria-labelledby="stage-create-details">
                            <h2 id="stage-create-details" className="mf-stage-create-section__label">
                                Stage details
                            </h2>
                            <div className="mf-stage-create-group">
                                <div className="mf-stage-create-field">
                                    <label className="mf-stage-create-field__label" htmlFor="stage-title-modal">
                                        Title
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
                                </div>
                                <div className="mf-stage-create-field">
                                    <label className="mf-stage-create-field__label" htmlFor="stage-description-modal">
                                        Description
                                        <span className="mf-stage-create-field__optional">Optional</span>
                                    </label>
                                    <textarea
                                        id="stage-description-modal"
                                        className="mf-stage-create__textarea"
                                        maxLength={maxDescriptionLength}
                                        rows={3}
                                        placeholder="What’s the vibe? Derby prep, transfer rumours, post-match…"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        disabled={processing}
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="mf-stage-create-section" aria-labelledby="stage-create-settings">
                            <h2 id="stage-create-settings" className="mf-stage-create-section__label">
                                Room settings
                            </h2>
                            <div className="mf-stage-create-group mf-stage-create-group--switches">
                                <SwitchRow
                                    id="stage-public-modal"
                                    label="Public stage"
                                    hint="Shows in the live lobby for any fan to discover."
                                    checked={data.is_public}
                                    onChange={(value) => setData('is_public', value)}
                                    disabled={processing}
                                />
                                <SwitchRow
                                    id="stage-invite-modal"
                                    label="Fans can invite"
                                    hint="Allow sharing the stage link to the terrace feed."
                                    checked={data.allow_invite}
                                    onChange={(value) => setData('allow_invite', value)}
                                    disabled={processing}
                                />
                                <SwitchRow
                                    id="stage-chat-modal"
                                    label="Room chat"
                                    hint="Listeners and speakers can post messages."
                                    checked={data.allow_chat}
                                    onChange={(value) => setData('allow_chat', value)}
                                    disabled={processing}
                                />
                                <SwitchRow
                                    id="stage-speak-modal"
                                    label="Speak requests"
                                    hint="Listeners can raise a hand to request the mic."
                                    checked={data.allow_speak_requests}
                                    onChange={(value) => setData('allow_speak_requests', value)}
                                    disabled={processing}
                                />
                            </div>
                        </section>

                        {stageBackgrounds.length > 0 ? (
                            <section className="mf-stage-create-section" aria-labelledby="stage-create-backdrop">
                                <h2 id="stage-create-backdrop" className="mf-stage-create-section__label">
                                    Stadium backdrop
                                </h2>
                                <div
                                    className="mf-stage-bg-picker"
                                    role="radiogroup"
                                    aria-label="Stage background"
                                >
                                    {stageBackgrounds.map((bg) => {
                                        const selected = data.background_key === bg.key;

                                        return (
                                            <label
                                                key={bg.key}
                                                className={`mf-stage-bg-picker__option ${selected ? 'is-selected' : ''}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="stage-background"
                                                    className="sr-only"
                                                    value={bg.key}
                                                    checked={selected}
                                                    onChange={() => setData('background_key', bg.key)}
                                                    disabled={processing}
                                                />
                                                <span
                                                    className="mf-stage-bg-picker__thumb"
                                                    style={{ backgroundImage: `url('${bg.url}')` }}
                                                    aria-hidden
                                                />
                                                <span className="mf-stage-bg-picker__label">{bg.label}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </section>
                        ) : null}
                    </div>

                    <div className="mf-stage-create-modal__sticky-foot">
                        {errors.title ? (
                            <p className="mf-field-error">{errors.title}</p>
                        ) : errors.description ? (
                            <p className="mf-field-error">{errors.description}</p>
                        ) : (
                            <p className="mf-mono mf-text-micro text-[var(--mf-muted)] mf-stage-create-modal__meta">
                                {remaining} title · {descriptionRemaining} desc · min 3 chars
                            </p>
                        )}
                        <button
                            type="submit"
                            className="mf-btn mf-btn--pitch mf-stage-create-modal__cta"
                            disabled={!canGoLive}
                        >
                            {processing ? 'Opening…' : 'Go live'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
