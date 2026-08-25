import { useForm } from '@inertiajs/react';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconClose } from '../components/post/icons';

/**
 * Self-profile settings modal — name, handle, bio and avatar upload. Portals
 * to <body> and reuses the shared `.mf-sheet` dialog chrome (see ComposeSheet).
 */
export default function YouSettingsModal({ open, onClose, identity }) {
    const titleId = useId();
    const fileInputRef = useRef(null);
    const [preview, setPreview] = useState(null);

    const { data, setData, patch, processing, errors, reset, clearErrors } = useForm({
        name: identity?.name || '',
        handle: identity?.handle || '',
        bio: identity?.bio || '',
        avatar: null,
    });

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        setData({
            name: identity?.name || '',
            handle: identity?.handle || '',
            bio: identity?.bio || '',
            avatar: null,
        });
        setPreview(null);
        clearErrors();

        function onKeyDown(event) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', onKeyDown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, identity]);

    if (!open) {
        return null;
    }

    function onAvatarChange(event) {
        const file = event.target.files?.[0] || null;
        setData('avatar', file);
        setPreview(file ? URL.createObjectURL(file) : null);
    }

    function submit(event) {
        event.preventDefault();
        patch('/social/you', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset('avatar');
                onClose();
            },
        });
    }

    return createPortal(
        <div className="mf-sheet mf-sheet--center" role="presentation">
            <button type="button" className="mf-sheet__backdrop" aria-label="Close settings" onClick={onClose} />
            <div
                className="mf-sheet__panel mf-you-settings"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
            >
                <div className="mf-sheet__head">
                    <p id={titleId} className="mf-display mf-text-title tracking-[0.03em]">
                        Edit profile
                    </p>
                    <button type="button" className="mf-stage-icon-btn" aria-label="Close" title="Close" onClick={onClose}>
                        <IconClose />
                    </button>
                </div>

                <form onSubmit={submit} className="mf-you-settings__form">
                    <div className="mf-you-settings__avatar-row">
                        {preview || identity?.avatar_url ? (
                            <img
                                src={preview || identity.avatar_url}
                                alt=""
                                className="mf-avatar mf-you-settings__avatar-preview"
                            />
                        ) : (
                            <div className="mf-avatar mf-you-settings__avatar-preview mf-text-section" aria-hidden>
                                {(data.name || '?').slice(0, 1).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <button
                                type="button"
                                className="mf-btn mf-btn--ghost"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Change photo
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/gif"
                                className="sr-only"
                                onChange={onAvatarChange}
                            />
                            {errors.avatar ? <p className="mf-you-settings__error">{errors.avatar}</p> : null}
                        </div>
                    </div>

                    <label className="mf-you-settings__field">
                        <span className="mf-text-caption">Name</span>
                        <input
                            type="text"
                            value={data.name}
                            maxLength={255}
                            onChange={(event) => setData('name', event.target.value)}
                            className="mf-you-settings__input"
                        />
                        {errors.name ? <p className="mf-you-settings__error">{errors.name}</p> : null}
                    </label>

                    <label className="mf-you-settings__field">
                        <span className="mf-text-caption">Handle</span>
                        <div className="mf-you-settings__handle-wrap">
                            <span className="mf-mono">@</span>
                            <input
                                type="text"
                                value={data.handle}
                                maxLength={255}
                                onChange={(event) => setData('handle', event.target.value)}
                                className="mf-you-settings__input mf-mono"
                            />
                        </div>
                        {errors.handle ? <p className="mf-you-settings__error">{errors.handle}</p> : null}
                    </label>

                    <label className="mf-you-settings__field">
                        <span className="mf-text-caption">Bio</span>
                        <textarea
                            value={data.bio || ''}
                            maxLength={280}
                            rows={3}
                            onChange={(event) => setData('bio', event.target.value)}
                            className="mf-you-settings__input mf-you-settings__textarea"
                            placeholder="Tell the terrace about yourself"
                        />
                        <span className="mf-text-caption mf-you-settings__count">{(data.bio || '').length}/280</span>
                        {errors.bio ? <p className="mf-you-settings__error">{errors.bio}</p> : null}
                    </label>

                    <div className="mf-you-settings__actions">
                        <button type="button" className="mf-btn mf-btn--ghost" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="mf-btn mf-btn--pitch" disabled={processing}>
                            {processing ? 'Saving…' : 'Save changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
}
